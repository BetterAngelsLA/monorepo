"""Benchmark the write-audit-log read path (ADR 0004 §20, §22).

Bulk-loads synthetic ``Shelter`` event rows, then times the selector and EXPLAINs
the SQL it captured. On-demand tool, not a CI test: it writes real rows and its
numbers are machine-dependent, so it must not gate a build.

    python manage.py bench_audit_read --objects 50 --events-per-object 2000 --analyze

Synthetic rows are written straight into the event table with ``bulk_create``
(``INSERT`` is unaffected by the update guard), use object ids at or above
``SYNTHETIC_BASE_ID`` and carry the ``bench.`` label prefix, so they can be
identified and deleted with an ordinary ``DELETE`` -- the very operation the
guard no longer blocks. The templating ``Shelter``, the ``ShelterAvailability``
its ``post_save`` signal creates, and their event rows are always removed on the
way out: they are fixture scaffolding, not measurement data. There is no
``--keep``; ``--cleanup`` removes leftovers from a hard-killed run without
inserting a new fixture.

Safety: this writes and deletes rows in the live event table. It refuses to run
unless ``DEBUG`` is on or ``BENCH_AUDIT_ALLOWED=true`` is set; a normal run
refuses if a live ``Shelter`` uses the synthetic id range; and it removes
samples left by a killed run before inserting anything.

What each flag is for:

* ``--objects``        how many objects to spread events over. Grow this to test
                       H1: per-object page-1 latency should stay flat in the total
                       table size because the ``(pgh_obj, pgh_id)`` index anchors
                       the union.
* ``--events-per-object``  grow this to test H2: the CTE materialises an object's
                       whole history before ``LIMIT``, so the object's own history
                       is the axis that should actually cost anything.
* ``--date-from``      start of the synthetic event window, and the selector's
                       ``date_from`` filter, to test H3 (does the predicate push
                       into the union?) and the bounded-vs-unbounded comparison.
* ``--unbounded``      also time the unanchored aggregate (admin/exports), which
                       has no ``references()`` anchor.
* ``--analyze``        run ``EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`` on the
                       selector's own SQL instead of guessing from timing.
* ``--cleanup``        delete leftover synthetic/sample rows and exit without
                       inserting or measuring.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import statistics
import time
from typing import Any, cast

import pgtrigger
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.models import Q
from django.utils import timezone
from model_bakery import baker
from pghistory.core import event_models

from audit.selectors import object_audit_log
from audit.types import AuditEventFilter
from shelters.models import Shelter, ShelterAvailability

# Synthetic object ids start here so they never collide with real rows and can be
# identified (and deleted) by a single predicate.
SYNTHETIC_BASE_ID = 900_000_000

# Name of the real ``Shelter`` used to derive the event template; stale copies
# from a killed run are removed by name (and null organization) on the next run.
_SAMPLE_NAME = "bench-sample"

# Synthetic event labels carry this prefix, so cleanup (including ``--cleanup``
# after a hard-killed run) can target the harness's own rows without relying on
# the object-id range.
_SYNTHETIC_LABEL_PREFIX = "bench."

_SKIPPED_TEMPLATE_FIELDS = frozenset({"pgh_id", "pgh_created_at", "pgh_label", "pgh_obj", "pgh_context"})


class Command(BaseCommand):
    help = "Bulk-load synthetic audit events and measure the selector's read cost."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("--objects", type=int, default=20, help="Synthetic objects to spread events over.")
        parser.add_argument(
            "--events-per-object",
            type=int,
            default=500,
            help="Event rows per synthetic object (one object's history size).",
        )
        parser.add_argument("--runs", type=int, default=5, help="Timed selector runs for the measured object.")
        parser.add_argument("--limit", type=int, default=50, help="Page size passed to the selector.")
        parser.add_argument(
            "--date-from",
            default=None,
            help="Start of the synthetic event window and the selector's date_from filter (YYYY-MM-DD).",
        )
        parser.add_argument("--date-to", default=None, help="Optional selector date_to filter (YYYY-MM-DD).")
        parser.add_argument("--unbounded", action="store_true", help="Also measure the unanchored aggregate.")
        parser.add_argument("--analyze", action="store_true", help="EXPLAIN (ANALYZE, BUFFERS) the captured SQL.")
        parser.add_argument("--batch-size", type=int, default=5000, help="bulk_create batch size.")
        parser.add_argument(
            "--cleanup",
            action="store_true",
            help="Delete leftover synthetic/sample rows and exit without inserting a fixture.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        objects = options["objects"]
        events_per_object = options["events_per_object"]
        if objects < 1 or events_per_object < 1:
            raise CommandError("--objects and --events-per-object must both be >= 1.")

        self._require_safe_environment()

        event_model = Shelter.pgh_event_model  # type: ignore[attr-defined]
        cleanup = options["cleanup"]
        if not cleanup:
            self._assert_synthetic_range_is_free()

        stale_rows = self._delete_stale_samples(event_model)
        removed = self._delete_synthetic(event_model)
        if cleanup:
            self.stdout.write(f"removed {removed} synthetic event rows and {stale_rows} stale sample event rows")
            return
        if stale_rows or removed:
            self.stdout.write(f"removed {removed} synthetic and {stale_rows} stale sample event rows")

        spread_start = self._parse_date(options["date_from"]) or (timezone.now() - datetime.timedelta(days=365 * 2))
        date_from = self._parse_date(options["date_from"])
        date_to = self._parse_date(options["date_to"])
        event_filter = AuditEventFilter(date_from=date_from, date_to=date_to)

        sample = baker.make(Shelter, name=_SAMPLE_NAME)
        try:
            sample_row = event_model.objects.filter(pgh_obj_id=sample.pk).first()
            if sample_row is None:
                raise CommandError("The sample Shelter produced no event row; is write tracking enabled?")

            template = self._template_row(event_model, sample_row)
            inserted = self._bulk_insert(
                event_model,
                template,
                objects=objects,
                events_per_object=events_per_object,
                batch_size=options["batch_size"],
            )
            self._spread_created_at(event_model, spread_start, events_per_object)
            self._analyze(event_model)
            self.stdout.write(
                self.style.SUCCESS(
                    f"inserted {inserted} synthetic event rows across {objects} objects, "
                    f"spread from {spread_start.date()} to now"
                )
            )

            measured_id = SYNTHETIC_BASE_ID + objects - 1
            measured = Shelter(pk=measured_id)
            self.stdout.write(
                f"measuring object pgh_obj_id={measured_id} "
                f"(history={events_per_object}, limit={options['limit']}, runs={options['runs']})"
            )

            timings, query_count, captured_sql, captured_params = self._time_selector(
                measured, event_filter, options["limit"], options["runs"]
            )
            self._report(timings, query_count, captured_sql)

            if options["analyze"]:
                self._explain(captured_sql, captured_params)

            cte_has, outer_has = self._date_predicate_placement(captured_sql)
            self.stdout.write(f"date predicate -> CTE branches: {cte_has}; outer SELECT: {outer_has}")

            if options["unbounded"]:
                self._measure_unanchored(options["analyze"])
        finally:
            # Cleanup runs even when a measurement fails or is interrupted: a
            # half-finished run must not leave synthetic rows or the sample.
            sample_rows = self._delete_sample(event_model, sample)
            removed = self._delete_synthetic(event_model)
            self.stdout.write(f"deleted {removed} synthetic event rows and {sample_rows} sample event rows")

    # -- safety --------------------------------------------------------------

    @staticmethod
    def _require_safe_environment() -> None:
        """Fail closed unless this is a dev database or the caller opted in.

        The command writes and deletes rows in the live event table, so a
        non-DEBUG database needs a deliberate opt-in.
        """
        env_allowed = os.environ.get("BENCH_AUDIT_ALLOWED", "").strip().lower() == "true"
        if not (settings.DEBUG or env_allowed):
            raise CommandError(
                "refusing to run: bench_audit_read writes and deletes real event rows. "
                "Run with DEBUG=true or set BENCH_AUDIT_ALLOWED=true."
            )

    @staticmethod
    def _assert_synthetic_range_is_free() -> None:
        """Refuse if a live Shelter uses the synthetic id range.

        A normal run inserts events for ``SYNTHETIC_BASE_ID + offset``; a real
        shelter owning one of those ids would have the fixture's events mixed
        into its history. ``--cleanup`` skips this check because it deletes by
        the harness's own labels, not by the id range.
        """
        clashing = Shelter.objects.filter(pk__gte=SYNTHETIC_BASE_ID).values_list("pk", flat=True).first()
        if clashing is not None:
            raise CommandError(
                f"refusing: Shelter pk {clashing} is inside the synthetic id range "
                f"(>= {SYNTHETIC_BASE_ID}); use a scratch database or raise SYNTHETIC_BASE_ID."
            )

    @classmethod
    def _delete_stale_samples(cls, event_model: Any) -> int:
        """Remove samples left by a run killed before its ``finally``.

        Only ``bench-sample`` shelters with no organization qualify: that is
        exactly what ``baker.make`` creates, and a real shelter would normally
        carry an organization.
        """
        stale = list(Shelter.objects.filter(name=_SAMPLE_NAME, organization__isnull=True))
        return sum(cls._delete_sample(event_model, sample) for sample in stale)

    # -- fixture -------------------------------------------------------------

    @staticmethod
    def _parse_date(raw: str | None) -> datetime.datetime | None:
        if raw is None:
            return None
        parsed = datetime.datetime.strptime(raw, "%Y-%m-%d").date()
        return datetime.datetime.combine(parsed, datetime.time.min, tzinfo=datetime.timezone.utc)

    @staticmethod
    def _template_row(event_model: Any, sample: Any) -> dict[str, Any]:
        """Every column but the ones we vary, taken from a real event row."""
        row: dict[str, Any] = {}
        for f in event_model._meta.concrete_fields:
            if f.name in _SKIPPED_TEMPLATE_FIELDS or f.attname in _SKIPPED_TEMPLATE_FIELDS:
                continue
            row[f.attname] = getattr(sample, f.attname)
        return row

    def _bulk_insert(
        self,
        event_model: Any,
        template: dict[str, Any],
        *,
        objects: int,
        events_per_object: int,
        batch_size: int,
    ) -> int:
        obj_field = self._attname(event_model, "pgh_obj")
        assert obj_field is not None  # every tracked event model has pgh_obj
        context_field = self._attname(event_model, "pgh_context")

        batch: list[Any] = []
        total = 0
        for offset in range(objects):
            obj_id = SYNTHETIC_BASE_ID + offset
            for i in range(events_per_object):
                fields = dict(template)
                fields[obj_field] = obj_id
                if context_field is not None:
                    fields[context_field] = None
                fields["pgh_label"] = (
                    f"{_SYNTHETIC_LABEL_PREFIX}shelter.add" if i == 0 else f"{_SYNTHETIC_LABEL_PREFIX}shelter.update"
                )
                # ``pgh_data``/``pgh_diff`` are not columns: the aggregate derives
                # them by diffing a row's tracked columns against the previous row
                # of the same object. Vary a tracked column so the derived diff is
                # non-empty, and mirror the object id into the tracked pk column.
                fields["name"] = f"Synthetic {obj_id} v{i}"
                if "id" in fields:
                    fields["id"] = obj_id
                batch.append(event_model(**fields))
                if len(batch) >= batch_size:
                    event_model.objects.bulk_create(batch, batch_size=batch_size)
                    total += len(batch)
                    batch = []
        if batch:
            event_model.objects.bulk_create(batch, batch_size=batch_size)
            total += len(batch)
        return total

    @staticmethod
    def _spread_created_at(event_model: Any, spread_start: datetime.datetime, events_per_object: int) -> None:
        """Spread ``pgh_created_at`` across the window after the bulk insert.

        ``pgh_created_at`` is ``auto_now_add``, so ``bulk_create`` stamps every row
        with "now" no matter what we pass. Backdating is an ``UPDATE``, which is
        exactly what the guard blocks -- so this is the one place the harness lifts
        it, the same escape hatch ``test_utils.pghistory.backdate_event_rows`` uses
        for tests. Never on a request path.
        """
        table = event_model._meta.db_table
        obj_col = Command._attname(event_model, "pgh_obj") or "pgh_obj_id"
        step = max((timezone.now() - spread_start).total_seconds(), 1.0) / max(events_per_object - 1, 1)
        sql = (
            f'WITH numbered AS (SELECT pgh_id, ROW_NUMBER() OVER (PARTITION BY "{obj_col}" ORDER BY pgh_id) - 1 AS n '
            f'FROM "{table}" WHERE "pgh_label" LIKE %s) '
            f'UPDATE "{table}" t SET pgh_created_at = %s + make_interval(secs => (n.n * %s)::double precision) '
            f"FROM numbered n WHERE n.pgh_id = t.pgh_id"
        )
        with pgtrigger.ignore(f"{event_model._meta.label}:protect_updates"):
            with connection.cursor() as cursor:
                cursor.execute(sql, [f"{_SYNTHETIC_LABEL_PREFIX}%", spread_start, step])

    @staticmethod
    def _analyze(event_model: Any) -> None:
        """Refresh planner statistics; without it plans (and timings) are erratic."""
        with connection.cursor() as cursor:
            cursor.execute(f'ANALYZE "{event_model._meta.db_table}"')

    @staticmethod
    def _attname(event_model: Any, field_name: str) -> str | None:
        try:
            return cast(str, event_model._meta.get_field(field_name).attname)
        except Exception:
            return None

    @staticmethod
    def _delete_synthetic(event_model: Any) -> int:
        obj_field = Command._attname(event_model, "pgh_obj") or "pgh_obj_id"
        synthetic = Q(pgh_label__startswith=_SYNTHETIC_LABEL_PREFIX)
        # Rows written before the label prefix existed (old ``--keep`` leftovers).
        legacy = Q(
            **{f"{obj_field}__gte": SYNTHETIC_BASE_ID},
            pgh_label__in=("shelter.add", "shelter.update"),
            name__startswith="Synthetic ",
        )
        deleted, _ = event_model.objects.filter(synthetic | legacy).delete()
        return int(deleted)

    @staticmethod
    def _delete_sample(event_model: Any, sample: Any) -> int:
        """Remove the templating Shelter and the event rows its lifecycle wrote.

        ``Shelter`` is tracked, so ``delete()`` writes a ``shelter.remove`` event
        of its own. The ``post_save`` signal also creates a tracked
        ``ShelterAvailability``; that object is deleted by cascade, but its
        add/remove events live in a *different* table and outlive it. Both trails
        are deleted after the object, otherwise every run leaves history behind
        for rows that no longer exist.
        """
        sample_pk = sample.pk
        sample.delete()
        obj_field = Command._attname(event_model, "pgh_obj") or "pgh_obj_id"
        deleted, _ = event_model.objects.filter(**{f"{obj_field}": sample_pk}).delete()

        availability_event_model = ShelterAvailability.pgh_event_model  # type: ignore[attr-defined]
        availability_deleted, _ = availability_event_model.objects.filter(shelter_id=sample_pk).delete()
        return int(deleted + availability_deleted)

    # -- measurement ---------------------------------------------------------

    def _time_selector(
        self,
        obj: Any,
        filters: AuditEventFilter,
        limit: int,
        runs: int,
    ) -> tuple[list[float], int, str, list[Any]]:
        timings: list[float] = []
        query_count = 0
        captured_sql = ""
        captured_params: list[Any] = []

        for run in range(max(runs, 1)):
            captured = self._capture()

            with connection.execute_wrapper(captured.wrapper):
                started = time.perf_counter()
                page = object_audit_log(
                    obj=obj,
                    target_type="SHELTER",
                    filters=filters,
                    limit=limit,
                )
                timings.append((time.perf_counter() - started) * 1000.0)

            if run == 0:
                query_count = len(captured.rows)
                self.stdout.write(f"page returned {len(page.results)} actions")
                captured_sql, captured_params = captured.widest_with_cte()

        return timings, query_count, captured_sql, captured_params

    def _measure_unanchored(self, analyze: bool) -> None:
        """Time the aggregate with no ``references()`` anchor (admin, exports).

        ``across(*event_models())`` is required: an aggregate proxy with no
        explicit ``across`` compiles an empty CTE and would measure nothing.
        """
        from audit.models import AuditWriteEvent

        captured = self._capture()
        with connection.execute_wrapper(captured.wrapper):
            started = time.perf_counter()
            rows = list(AuditWriteEvent.objects.across(*event_models()).exclude(label="seed")[:50])
            elapsed = (time.perf_counter() - started) * 1000.0
        self.stdout.write(f"unanchored aggregate (limit 50): {elapsed:.2f} ms for {len(rows)} rows")
        if analyze:
            sql, params = captured.widest_with_cte()
            self._explain(sql, params)

    @staticmethod
    def _capture() -> Any:
        class _Capture:
            def __init__(self) -> None:
                self.rows: list[tuple[str, list[Any]]] = []

            def wrapper(self, execute: Any, sql: str, params: Any, many: bool, context: Any) -> Any:
                self.rows.append((sql, list(params or [])))
                return execute(sql, params, many, context)

            def widest_with_cte(self) -> tuple[str, list[Any]]:
                candidates = [r for r in self.rows if r[0].lstrip().startswith("WITH")] or self.rows
                return max(candidates, key=lambda r: len(r[0]), default=("", []))

        return _Capture()

    @staticmethod
    def _date_predicate_placement(sql: str) -> tuple[bool, bool]:
        """Whether a ``pgh_created_at >=`` predicate sits in the CTE or the outer SELECT.

        The CTE ends at the last ``)\\nSELECT``; anything after is the outer query.
        """
        index = sql.rfind(")\nSELECT")
        cte, outer = (sql[:index], sql[index:]) if index > 0 else (sql, "")
        pattern = re.compile(r'pgh_created_at"?\s*>=')
        return bool(pattern.search(cte)), bool(pattern.search(outer))

    def _report(self, timings: list[float], query_count: int, captured_sql: str) -> None:
        self.stdout.write(f"queries per page: {query_count}")
        self.stdout.write(
            f"latency ms: min={min(timings):.2f} median={statistics.median(timings):.2f} max={max(timings):.2f}"
        )
        self.stdout.write(f"widest captured SQL is {len(captured_sql)} chars")

    def _explain(self, sql: str, params: list[Any]) -> None:
        if not sql:
            self.stderr.write("no captured SQL to EXPLAIN")
            return
        with connection.cursor() as cursor:
            cursor.execute(f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {sql}", params)
            row = cursor.fetchone()
        summary = self._summarize_plan(row[0])
        self.stdout.write("EXPLAIN (ANALYZE, BUFFERS):")
        for key, value in summary.items():
            self.stdout.write(f"  {key}: {value}")

    @staticmethod
    def _summarize_plan(raw: Any) -> dict[str, Any]:
        data = json.loads(raw) if isinstance(raw, str) else raw
        root = data[0] if isinstance(data, list) else data
        node = root.get("Plan", root)
        seq_scans = 0
        index_scans = 0

        def walk(n: dict[str, Any]) -> None:
            nonlocal seq_scans, index_scans
            kind = n.get("Node Type")
            if kind == "Seq Scan":
                seq_scans += 1
            elif kind in ("Index Scan", "Index Only Scan", "Bitmap Heap Scan"):
                index_scans += 1
            for child in n.get("Plans", []):
                walk(child)

        walk(node)
        return {
            "root": node.get("Node Type"),
            "plan_rows": node.get("Plan Rows"),
            "actual_rows": node.get("Actual Rows"),
            "seq_scans": seq_scans,
            "index_scans": index_scans,
            "shared_hit_blocks": node.get("Shared Hit Blocks"),
            "shared_read_blocks": node.get("Shared Read Blocks"),
            "planning_time_ms": root.get("Planning Time"),
            "execution_time_ms": root.get("Execution Time"),
        }

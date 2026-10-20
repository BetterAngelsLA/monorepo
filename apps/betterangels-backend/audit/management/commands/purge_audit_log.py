"""Delete audit event rows older than a cutoff (ADR 0004 §31).

The event tables are append-*protected* against `UPDATE` but deliberately allow
`DELETE` (ADR 0004 §9b), so retention is an ordinary batched delete rather than a
partitioned-table operation.

Targets, both batched to avoid long locks:

* ``pghistory`` ``*Event`` tables in the requested apps (``--apps``, default
  ``shelters``), except the ``RETAINED_LABELS`` the reporting selectors rebuild
  state from. Other apps' event tables are untouched unless named explicitly:
  they belong to other features (client export, ``NoteReverter``), not to the
  audit log, and a command named ``purge_audit_log`` must not silently delete
  them.
* ``pghistory.Context`` rows older than the cutoff that no surviving event row
  references any more (deleting an event row does not cascade to its context,
  because that FK is ``DO_NOTHING, db_constraint=False``).

Within an event table, the newest deletable row per object is retained when the
object still has newer rows. pghistory computes ``pgh_diff`` at read time from
``_prev_data`` (the row with the greatest ``pgh_id`` below the current row), so
deleting that row silently rewrites the first surviving event's diff to NULL.
The rule is a correlated ``EXISTS`` pair in the delete predicate, so it needs no
list of retained ids.

Read-event retention is specified in ADR 0004 §22-§29 and is out of scope here.
"""

import datetime
from typing import Any, cast

from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.db.models import Exists, OuterRef
from django.utils import timezone
from pghistory.core import event_models
from pghistory.models import Context

# Rows newer than this are refused unless ``--force`` is passed, so a mistyped
# date cannot truncate live audit history. The retention window is 1-2 years;
# this is the floor, not the schedule.
MIN_RETENTION_DAYS = 730

# Apps whose event tables this command may delete from by default. The command
# is the audit feature's retention tool; other apps own their own history
# (clients, notes, tasks, referrals, accounts) and require an explicit --apps.
DEFAULT_APPS = ("shelters",)

# Event labels the reporting selectors rebuild state from
# (``shelters/selectors/reports.py``). These rows are NOT audit-only storage:
# pruning them silently zeroes the occupancy and bed-count reports, because
# ``_bed_lifecycles`` and ``_reservation_status_intervals`` reconstruct object
# existence from ``*.add`` with no lower bound and return empty when it is gone.
# They are retained indefinitely; see ADR 0004 §31.
RETAINED_LABELS = frozenset(
    {
        "bed.add",
        "bed.update",
        "bed.remove",
        "reservation.add",
        "reservation.status_change",
    }
)


class Command(BaseCommand):
    help = "Delete audit event rows older than --before (ADR 0004 §31)."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--before",
            required=True,
            help="Cutoff date (YYYY-MM-DD). Rows strictly older than this are deleted.",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=5000,
            help="Rows deleted per transaction. Smaller batches hold locks for less time.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help=(
                "Report what would be deleted, then stop. Counts are for the state right now: "
                "a real run can orphan further contexts once it deletes the events that reference them."
            ),
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help=f"Skip the {MIN_RETENTION_DAYS}-day retention-window guard.",
        )
        parser.add_argument(
            "--apps",
            nargs="*",
            default=list(DEFAULT_APPS),
            help=(
                "Event-model app labels to purge (default: shelters). Other apps own their "
                "history (clients, notes, tasks, referrals, accounts); name them explicitly "
                "to include them."
            ),
        )

    def handle(self, *args: Any, **options: Any) -> None:
        before = self._parse_before(options["before"])
        batch_size = options["batch_size"]
        if batch_size < 1:
            raise CommandError("--batch-size must be at least 1.")
        dry_run = options["dry_run"]

        models = event_models()
        apps = list(dict.fromkeys(options["apps"]))
        if not apps:
            raise CommandError("--apps requires at least one app label.")
        known_apps = {model._meta.app_label for model in models}
        unknown = sorted(set(apps) - known_apps)
        if unknown:
            raise CommandError(
                f"Unknown --apps label(s): {', '.join(unknown)}. Known labels: {', '.join(sorted(known_apps))}."
            )
        selected = [model for model in models if model._meta.app_label in apps]

        earliest_allowed = timezone.now() - datetime.timedelta(days=MIN_RETENTION_DAYS)
        if before > earliest_allowed and not options["force"]:
            raise CommandError(
                f"--before {before.date()} falls inside the {MIN_RETENTION_DAYS}-day retention window "
                f"(earliest allowed is {earliest_allowed.date()}). Pass --force to purge it anyway."
            )

        event_total = 0
        for model in selected:
            deleted = self._purge_event_model(model, before, batch_size, dry_run)
            if deleted:
                self.stdout.write(f"  {model._meta.label}: {deleted}")
            event_total += deleted

        context_total = self._purge_orphan_contexts(before, batch_size, dry_run)

        prefix = "[dry-run] would delete" if dry_run else "deleted"
        scope = ", ".join(apps)
        self.stdout.write(
            self.style.SUCCESS(f"{prefix} {event_total} event rows and {context_total} orphan contexts (apps: {scope})")
        )

    @staticmethod
    def _parse_before(raw: str) -> datetime.datetime:
        try:
            parsed = datetime.datetime.strptime(raw, "%Y-%m-%d").date()
        except ValueError as err:
            raise CommandError(f"Invalid --before date '{raw}'; expected YYYY-MM-DD.") from err
        # Midnight UTC on the cutoff, so a row created later the same day survives.
        return datetime.datetime.combine(parsed, datetime.time.min, tzinfo=datetime.timezone.utc)

    @staticmethod
    def _deletable_rows(model: Any, before: datetime.datetime) -> Any:
        """The rows this run may delete, with the per-object boundary already excluded.

        pghistory's aggregate computes ``pgh_diff`` at read time from
        ``_prev_data``: the row with the greatest ``pgh_id`` below the current
        row, regardless of label or cutoff. Deleting that row makes the first
        surviving event diff against nothing, so its ``pgh_diff`` becomes NULL
        and an edit silently disappears from the audit log.

        The boundary is the newest *deletable* row of an object, kept only when
        the object still has a newer surviving row. Both halves of that test are
        correlated ``EXISTS`` on ``(pgh_obj, pgh_id)``, so the rule folds into the
        delete predicate and no id list is ever materialized: a Python list would
        put one parameter per object in the statement and pin the RDS Proxy
        connection, which is exactly what the batched loop below avoids.

        A row is deletable when it has a newer deletable row (it is not the
        boundary), or when it has no newer row at all (nothing to preserve a base
        for). Only a row that is both object-newest *among deletable rows* and
        outlived by a surviving row is withheld -- and that row is the boundary.
        Through event models have no ``pgh_obj`` (and no ``_prev_data``), so they
        need no boundary.
        """
        deletable = model._default_manager.filter(pgh_created_at__lt=before).exclude(pgh_label__in=RETAINED_LABELS)
        if not hasattr(model, "pgh_obj_id"):
            return deletable

        # A NULL ``pgh_obj_id`` compares unknown in both predicates, so it falls
        # through to "no newer row" and is deleted -- correct, since a row with no
        # object has no successor whose base it could provide.
        newer_deletable = Exists(deletable.filter(pgh_obj_id=OuterRef("pgh_obj_id"), pgh_id__gt=OuterRef("pgh_id")))
        newer_any = Exists(
            model._default_manager.filter(pgh_obj_id=OuterRef("pgh_obj_id"), pgh_id__gt=OuterRef("pgh_id"))
        )
        return deletable.filter(newer_deletable | ~newer_any)

    @classmethod
    def _purge_event_model(cls, model: Any, before: datetime.datetime, batch_size: int, dry_run: bool) -> int:
        rows = cls._deletable_rows(model, before)

        if dry_run:
            # Count the whole set. Returning after the first batch would report at
            # most ``batch_size`` rows no matter how much is older than the cutoff,
            # and this total is the only pre-flight signal before an irreversible
            # delete. Boundary rows are excluded: they are deliberately retained.
            return cast(int, rows.count())

        deleted_total = 0
        while True:
            # Rebuild the slice each pass so it re-queries. Rows deleted in the
            # previous pass no longer match the filter, so the slice already
            # advances; a growing ``pk__in`` exclusion is unnecessary and would
            # bloat the statement (and pin the RDS Proxy connection).
            ids = list(rows.values_list("pk", flat=True)[:batch_size])
            if not ids:
                return deleted_total

            with transaction.atomic():
                deleted, _ = model._default_manager.filter(pk__in=ids).delete()
            deleted_total += cast(int, deleted)
            if deleted == 0:
                # Nothing removed this pass; stop rather than spin.
                return deleted_total
            if len(ids) < batch_size:
                return deleted_total

    @staticmethod
    def _purge_orphan_contexts(before: datetime.datetime, batch_size: int, dry_run: bool) -> int:
        if dry_run:
            return Command._count_orphan_contexts(before)

        deleted_total = 0
        while True:
            ids = Command._orphan_context_ids(before, batch_size)
            if not ids:
                return deleted_total
            with transaction.atomic():
                deleted, _ = Context.objects.filter(pk__in=ids).delete()
            deleted_total += deleted
            if deleted == 0:
                return deleted_total
            if len(ids) < batch_size:
                return deleted_total

    @staticmethod
    def _orphan_context_where() -> str | None:
        """``NOT EXISTS`` over every event table, or ``None`` if there are none.

        One predicate per event table beats probing each candidate context per
        table. Table names come from model metadata, not user input.
        """
        tables = sorted({model._meta.db_table for model in event_models() if hasattr(model, "pgh_context_id")})
        if not tables:
            return None
        return " AND ".join(f'NOT EXISTS (SELECT 1 FROM "{table}" e WHERE e.pgh_context_id = c.id)' for table in tables)

    @staticmethod
    def _orphan_context_ids(before: datetime.datetime, limit: int) -> list[Any]:
        where = Command._orphan_context_where()
        if where is None:
            return []
        sql = f'SELECT c.id FROM "{Context._meta.db_table}" c WHERE c.created_at < %s AND {where} LIMIT %s'
        with connection.cursor() as cursor:
            cursor.execute(sql, [before, limit])
            return [row[0] for row in cursor.fetchall()]

    @staticmethod
    def _count_orphan_contexts(before: datetime.datetime) -> int:
        where = Command._orphan_context_where()
        if where is None:
            return 0
        sql = f'SELECT COUNT(*) FROM "{Context._meta.db_table}" c WHERE c.created_at < %s AND {where}'
        with connection.cursor() as cursor:
            cursor.execute(sql, [before])
            return int(cursor.fetchone()[0])

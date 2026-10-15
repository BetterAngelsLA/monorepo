"""Delete audit event rows older than a cutoff (ADR 0004 §31).

The event tables are append-*protected* against `UPDATE` but deliberately allow
`DELETE` (ADR 0004 §9b), so retention is an ordinary batched delete rather than a
partitioned-table operation.

Two targets, both batched to avoid long locks:

* ``pghistory`` ``*Event`` tables -- the per-model write event rows, except the
  ``RETAINED_LABELS`` the reporting selectors rebuild state from.
* ``pghistory.Context`` rows older than the cutoff that no surviving event row
  references any more (deleting an event row does not cascade to its context,
  because that FK is ``DO_NOTHING, db_constraint=False``).

Read-event retention is specified in ADR 0004 §22-§29 and is out of scope here.
"""

import datetime
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.utils import timezone
from pghistory.core import event_models
from pghistory.models import Context

# Rows newer than this are refused unless ``--force`` is passed, so a mistyped
# date cannot truncate live audit history. The retention window is 1-2 years;
# this is the floor, not the schedule.
MIN_RETENTION_DAYS = 730

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
        parser.add_argument("--dry-run", action="store_true", help="Report what would be deleted, then stop.")
        parser.add_argument(
            "--force",
            action="store_true",
            help=f"Skip the {MIN_RETENTION_DAYS}-day retention-window guard.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        before = self._parse_before(options["before"])
        batch_size = options["batch_size"]
        dry_run = options["dry_run"]

        earliest_allowed = timezone.now() - datetime.timedelta(days=MIN_RETENTION_DAYS)
        if before > earliest_allowed and not options["force"]:
            raise CommandError(
                f"--before {before.date()} falls inside the {MIN_RETENTION_DAYS}-day retention window "
                f"(earliest allowed is {earliest_allowed.date()}). Pass --force to purge it anyway."
            )

        event_total = 0
        for model in event_models():
            deleted = self._purge_event_model(model, before, batch_size, dry_run)
            if deleted:
                self.stdout.write(f"  {model._meta.label}: {deleted}")
            event_total += deleted

        context_total = self._purge_orphan_contexts(before, batch_size, dry_run)

        prefix = "[dry-run] would delete" if dry_run else "deleted"
        self.stdout.write(self.style.SUCCESS(f"{prefix} {event_total} event rows and {context_total} orphan contexts"))

    @staticmethod
    def _parse_before(raw: str) -> datetime.datetime:
        parsed = datetime.datetime.strptime(raw, "%Y-%m-%d").date()
        # Midnight UTC on the cutoff, so a row created later the same day survives.
        return datetime.datetime.combine(parsed, datetime.time.min, tzinfo=datetime.timezone.utc)

    @staticmethod
    def _purge_event_model(model: Any, before: datetime.datetime, batch_size: int, dry_run: bool) -> int:
        deleted_total = 0
        seen: set[Any] = set()
        while True:
            # Rebuild the queryset each pass so the slice re-queries.
            batch = (
                model._default_manager.filter(pgh_created_at__lt=before)
                .exclude(pgh_label__in=RETAINED_LABELS)
                .values_list("pk", flat=True)
            )
            if seen:
                batch = batch.exclude(pk__in=seen)
            ids = list(batch[:batch_size])
            if not ids:
                return deleted_total

            if dry_run:
                return deleted_total + len(ids)

            with transaction.atomic():
                deleted, _ = model._default_manager.filter(pk__in=ids).delete()
            deleted_total += deleted
            seen.update(ids)
            if deleted == 0:
                # Nothing removed this pass; stop rather than spin.
                return deleted_total
            if len(ids) < batch_size:
                return deleted_total

    @staticmethod
    def _purge_orphan_contexts(before: datetime.datetime, batch_size: int, dry_run: bool) -> int:
        deleted_total = 0
        while True:
            ids = Command._orphan_context_ids(before, batch_size)
            if not ids:
                return deleted_total
            if dry_run:
                return deleted_total + len(ids)
            with transaction.atomic():
                deleted, _ = Context.objects.filter(pk__in=ids).delete()
            deleted_total += deleted
            if deleted == 0:
                return deleted_total
            if len(ids) < batch_size:
                return deleted_total

    @staticmethod
    def _orphan_context_ids(before: datetime.datetime, limit: int) -> list[Any]:
        """Context ids older than the cutoff that no surviving event row uses.

        One query with a ``NOT EXISTS`` per event table beats probing each
        candidate context per table. Table names come from model metadata, not
        user input.
        """
        tables = sorted(
            {model._meta.db_table for model in event_models() if hasattr(model, "pgh_context_id")}
        )
        if not tables:
            return []

        not_referenced = " AND ".join(
            f'NOT EXISTS (SELECT 1 FROM "{table}" e WHERE e.pgh_context_id = c.id)' for table in tables
        )
        sql = (
            f'SELECT c.id FROM "{Context._meta.db_table}" c '
            f"WHERE c.created_at < %s AND {not_referenced} LIMIT %s"
        )
        with connection.cursor() as cursor:
            cursor.execute(sql, [before, limit])
            return [row[0] for row in cursor.fetchall()]

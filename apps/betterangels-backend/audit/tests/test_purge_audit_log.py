"""Tests for the `purge_audit_log` retention command (ADR 0004 §31)."""

import datetime

import pghistory
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.utils import timezone
from model_bakery import baker
from pghistory.core import event_models
from pghistory.models import Context

from audit.management.commands.purge_audit_log import RETAINED_LABELS
from shelters.models import Bed, Shelter
from shelters.selectors.reports import daily_occupancy, report_bed_status_counts
from test_utils.pghistory import UPDATE_GUARD, backdate_event_rows

BedEvent = Bed.pgh_event_model  # type: ignore[attr-defined]
ShelterEvent = Shelter.pgh_event_model  # type: ignore[attr-defined]

_OLD = datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc)
_CUTOFF = "2021-01-01"


def _backdate_guarded_events_for_context(context: Context, when: datetime.datetime) -> None:
    """Age every guarded event row that references ``context`` past the cutoff.

    A single tracked write can fan out into several event tables (baker's FK
    auto-creation means one ``Shelter`` writes a ``ShelterAvailability`` too), so
    aging only the row we think we wrote would leave the context referenced and
    the test vacuous.
    """
    for model in event_models():
        names = {trigger.name for trigger in getattr(model._meta, "triggers", [])}
        if UPDATE_GUARD not in names:
            continue
        backdate_event_rows(model._default_manager.filter(pgh_context_id=context.pk), pgh_created_at=when)


def _event_rows_for_context(context: Context, *, retained: bool) -> set[tuple[str, int]]:
    """Every event row referencing ``context``, split by retention status."""
    rows: set[tuple[str, int]] = set()
    for model in event_models():
        if not hasattr(model, "pgh_label"):
            continue
        queryset = model._default_manager.filter(pgh_context_id=context.pk)
        queryset = (
            queryset.filter(pgh_label__in=RETAINED_LABELS)
            if retained
            else queryset.exclude(pgh_label__in=RETAINED_LABELS)
        )
        rows |= {(model._meta.label, pk) for pk in queryset.values_list("pk", flat=True)}
    return rows


class PurgeAuditLogTestCase(TestCase):
    def test_refuses_to_purge_inside_the_retention_window(self) -> None:
        """A mistyped date must not truncate live audit history (ADR 0004 §31)."""
        recent = timezone.now().date().isoformat()

        with self.assertRaises(CommandError) as ctx:
            call_command("purge_audit_log", before=recent)

        self.assertIn("retention window", str(ctx.exception))

    def test_force_overrides_the_retention_window(self) -> None:
        recent = timezone.now().date().isoformat()

        # Should not raise; nothing is old enough to delete.
        call_command("purge_audit_log", before=recent, force=True)

    # ── deletion scope ───────────────────────────────────────────────────────

    def test_deletes_event_rows_older_than_the_cutoff(self) -> None:
        # Uses shelter.* (not bed.*): the bed labels are report-critical and so
        # are deliberately retained (see the retained-label tests below).
        shelter = Shelter.objects.create(name="Purge Shelter")
        shelter.name = "Renamed Shelter"
        shelter.save()

        events = ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).order_by("pk")
        old_event = events.first()
        self.assertIsNotNone(old_event)
        backdate_event_rows(ShelterEvent.objects.filter(pk=old_event.pk), pgh_created_at=_OLD)
        surviving = set(events.values_list("pk", flat=True)) - {old_event.pk}

        call_command("purge_audit_log", before=_CUTOFF)

        self.assertFalse(ShelterEvent.objects.filter(pk=old_event.pk).exists())
        self.assertEqual(set(ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).values_list("pk", flat=True)), surviving)

    def test_retains_report_critical_labels_and_deletes_the_rest(self) -> None:
        """The blast radius is pinned: report-critical labels survive, the rest go."""
        with pghistory.context(label="scope"):
            shelter = Shelter.objects.create(name="Scope Shelter")
            Bed.objects.create(shelter=shelter, name="Scope Bed")
        context = Context.objects.get(metadata__label="scope")
        _backdate_guarded_events_for_context(context, _OLD)

        retained_before = _event_rows_for_context(context, retained=True)
        deleted_before = _event_rows_for_context(context, retained=False)
        # Guard against a vacuous pass: the fixture must produce both kinds.
        self.assertEqual(retained_before, {("shelters.BedEvent", BedEvent.objects.get(pgh_label="bed.add").pk)})
        self.assertTrue(deleted_before)

        call_command("purge_audit_log", before=_CUTOFF)

        # Every retention-protected row is still there...
        self.assertEqual(_event_rows_for_context(context, retained=True), retained_before)
        # ...and everything else in the same, aged action is gone.
        self.assertEqual(_event_rows_for_context(context, retained=False), set())

    def test_removes_orphan_contexts_and_keeps_referenced_ones(self) -> None:
        with pghistory.context(label="old"):
            baker.make(Shelter, name="Old Shelter")
        old_context = Context.objects.get(metadata__label="old")

        with pghistory.context(label="recent"):
            baker.make(Shelter, name="Recent Shelter")
        recent_context = Context.objects.get(metadata__label="recent")

        # Age the old context and every guarded event row that references it.
        Context.objects.filter(pk=old_context.pk).update(created_at=_OLD)
        _backdate_guarded_events_for_context(old_context, _OLD)

        call_command("purge_audit_log", before=_CUTOFF)

        self.assertFalse(Context.objects.filter(pk=old_context.pk).exists())
        # The recent context is still referenced by a surviving event row.
        self.assertTrue(Context.objects.filter(pk=recent_context.pk).exists())

    def test_dry_run_deletes_nothing(self) -> None:
        shelter = baker.make(Shelter, name="Dry Run Shelter")
        bed = baker.make(Bed, shelter=shelter, name="Dry Run Bed")
        event = BedEvent.objects.filter(pgh_obj_id=bed.pk).first()
        self.assertIsNotNone(event)
        backdate_event_rows(BedEvent.objects.filter(pk=event.pk), pgh_created_at=_OLD)

        before_count = BedEvent.objects.count()

        call_command("purge_audit_log", before=_CUTOFF, dry_run=True)

        self.assertEqual(BedEvent.objects.count(), before_count)
        self.assertTrue(BedEvent.objects.filter(pk=event.pk).exists())

    # ── interaction with the reporting selectors ─────────────────────────────

    def test_purge_leaves_report_output_unchanged(self) -> None:
        """The retained labels are the reports' source of truth; the purge is safe.

        Purging the ``bed.*`` rows would zero the occupancy and bed-count
        reports, because ``shelters/selectors/reports.py`` rebuilds state from
        them with no lower bound (ADR 0004 §31).
        """
        with pghistory.context(label="report-fixture"):
            shelter = Shelter.objects.create(name="Report Shelter")
            bed = Bed.objects.create(shelter=shelter, name="Report Bed")
        context = Context.objects.get(metadata__label="report-fixture")
        _backdate_guarded_events_for_context(context, _OLD)

        start = timezone.now() - datetime.timedelta(days=30)
        end = timezone.now()
        counts_before = report_bed_status_counts(shelter=shelter, start=start, end=end)
        occupancy_before = daily_occupancy(shelter=shelter, start=start, end=end)
        # Guard against a vacuous pass: the reports must be non-trivial.
        self.assertTrue(counts_before)
        self.assertTrue(occupancy_before)
        self.assertEqual(occupancy_before[0].total_beds, 1)

        call_command("purge_audit_log", before=_CUTOFF)

        self.assertEqual(report_bed_status_counts(shelter=shelter, start=start, end=end), counts_before)
        self.assertEqual(daily_occupancy(shelter=shelter, start=start, end=end), occupancy_before)
        # ``bed.add`` is the reports' source of truth, so it must survive the purge.
        self.assertTrue(BedEvent.objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.add").exists())

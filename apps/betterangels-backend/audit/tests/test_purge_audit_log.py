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

from shelters.models import Bed, Shelter
from test_utils.pghistory import UPDATE_GUARD, backdate_event_rows

BedEvent = Bed.pgh_event_model  # type: ignore[attr-defined]

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

    def test_deletes_event_rows_older_than_the_cutoff(self) -> None:
        shelter = baker.make(Shelter, name="Purge Shelter")
        bed = baker.make(Bed, shelter=shelter, name="Purge Bed")

        old_event = BedEvent.objects.filter(pgh_obj_id=bed.pk).first()
        self.assertIsNotNone(old_event)
        backdate_event_rows(BedEvent.objects.filter(pk=old_event.pk), pgh_created_at=_OLD)

        bed.name = "Renamed Bed"
        bed.save()
        surviving = set(BedEvent.objects.filter(pgh_obj_id=bed.pk).values_list("pk", flat=True)) - {old_event.pk}

        call_command("purge_audit_log", before=_CUTOFF)

        self.assertFalse(BedEvent.objects.filter(pk=old_event.pk).exists())
        self.assertEqual(set(BedEvent.objects.filter(pgh_obj_id=bed.pk).values_list("pk", flat=True)), surviving)

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

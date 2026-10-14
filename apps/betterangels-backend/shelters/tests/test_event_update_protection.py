"""The audit event tables reject UPDATE but allow DELETE (ADR 0004 §9b).

`pgtrigger.Protect(operation=Update)` guards the event tables against a silent
rewrite of recorded history, while deliberately leaving `DELETE` free so retention
is an ordinary batched delete rather than a partitioned-table operation
(ADR 0004 §31).

This is not a privilege boundary: `UPDATE`/`DELETE` can still be issued by a role
that sets `pgtrigger.ignore`, by a table owner running `ALTER TABLE ... DISABLE
TRIGGER`, or via `session_replication_role = replica`, and `TRUNCATE` was never
covered. What it buys is a loud failure on an *accidental* rewrite.

These tests pin the contract: the guards must be declared *and* installed,
`UPDATE` must be rejected, `DELETE` must be permitted, and normal writes must
still work.

Deliberately does not use `test_utils.pghistory.backdate_event_rows` -- the point
is the unguarded behaviour.
"""

import datetime
from typing import Any

from django.db import DatabaseError, connection, transaction
from django.test import TestCase
from model_bakery import baker

from shelters.models import (
    Bed,
    ContactInfo,
    MediaLink,
    Reservation,
    ReservationClient,
    Room,
    Schedule,
    Shelter,
    ShelterAvailability,
    ShelterPhoto,
    Video,
)
from test_utils.pghistory import UPDATE_GUARD

# The 11 audit-critical event models that opt into update protection (ADR 0004 §10).
_UPDATE_PROTECTED_MODELS = (
    Shelter,
    Bed,
    Room,
    ContactInfo,
    ShelterAvailability,
    ShelterPhoto,
    Video,
    MediaLink,
    Schedule,
    Reservation,
    ReservationClient,
)


def _event_model(model: Any) -> Any:
    return model.pgh_event_model  # type: ignore[attr-defined]


class EventUpdateProtectionTestCase(TestCase):
    def test_every_audit_event_model_declares_the_update_guard(self) -> None:
        for model in _UPDATE_PROTECTED_MODELS:
            event_model = _event_model(model)
            names = {trigger.name for trigger in event_model._meta.triggers}
            self.assertIn(UPDATE_GUARD, names, event_model._meta.label)

    def test_update_guards_are_installed_in_postgres(self) -> None:
        """A declared trigger is not an installed trigger: check the database."""
        expected_tables = {_event_model(model)._meta.db_table for model in _UPDATE_PROTECTED_MODELS}

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT c.relname
                FROM pg_trigger t
                JOIN pg_class c ON c.oid = t.tgrelid
                WHERE t.tgname LIKE 'pgtrigger_protect_updates%'
                """
            )
            installed_tables = {row[0] for row in cursor.fetchall()}

        self.assertEqual(expected_tables - installed_tables, set())

    def _a_bed_event(self) -> tuple[Any, Any]:
        shelter = baker.make(Shelter, name="Update-Protected Shelter")
        bed = baker.make(Bed, shelter=shelter, name="Update-Protected Bed")
        event = _event_model(Bed).objects.filter(pgh_obj_id=bed.pk).first()
        self.assertIsNotNone(event)
        return bed, event

    def test_update_of_an_event_row_is_rejected(self) -> None:
        _, event = self._a_bed_event()

        with self.assertRaises(DatabaseError) as ctx:
            with transaction.atomic():
                _event_model(Bed).objects.filter(pk=event.pk).update(
                    pgh_created_at=datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc)
                )

        self.assertIn("Cannot update", str(ctx.exception))

    def test_delete_of_an_event_row_is_allowed(self) -> None:
        """Retention depends on this: `DELETE` must not be blocked (ADR 0004 §31)."""
        _, event = self._a_bed_event()
        event_model = _event_model(Bed)

        deleted, _ = event_model.objects.filter(pk=event.pk).delete()

        self.assertEqual(deleted, 1)
        self.assertFalse(event_model.objects.filter(pk=event.pk).exists())

    def test_inserting_event_rows_is_still_allowed(self) -> None:
        """The guard is `UPDATE`-only; writes must keep recording."""
        shelter = baker.make(Shelter, name="Still Writable")

        # Creating the bed writes a bed.add event via the trigger.
        bed = baker.make(Bed, shelter=shelter, name="Still Writable Bed")
        self.assertTrue(_event_model(Bed).objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.add").exists())

        # ...and updating the tracked model writes another event.
        bed.name = "Renamed Bed"
        bed.save()
        self.assertTrue(_event_model(Bed).objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.update").exists())

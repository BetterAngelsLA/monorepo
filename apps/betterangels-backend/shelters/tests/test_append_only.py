"""The audit event tables are append-only (ADR 0004 §10).

`append_only=True` on a tracker compiles to a `pgtrigger.Protect` on
`UPDATE OR DELETE`, so the audit trail cannot be silently rewritten. These tests
pin that contract: the triggers must be declared *and* installed, both mutation
operations must be rejected, and normal writes must still work.

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

# The 11 audit-critical models that opt into append-only tracking (ADR 0004 §10).
_APPEND_ONLY_MODELS = (
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


class AppendOnlyEventTablesTestCase(TestCase):
    def test_every_audit_event_model_declares_an_append_only_trigger(self) -> None:
        for model in _APPEND_ONLY_MODELS:
            event_model = _event_model(model)
            names = {trigger.name for trigger in event_model._meta.triggers}
            self.assertIn("append_only", names, event_model._meta.label)

    def test_append_only_triggers_are_installed_in_postgres(self) -> None:
        """A declared trigger is not an installed trigger: check the database."""
        expected_tables = {_event_model(model)._meta.db_table for model in _APPEND_ONLY_MODELS}

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT c.relname
                FROM pg_trigger t
                JOIN pg_class c ON c.oid = t.tgrelid
                WHERE t.tgname LIKE 'pgtrigger_append_only%'
                """
            )
            installed_tables = {row[0] for row in cursor.fetchall()}

        self.assertEqual(expected_tables - installed_tables, set())

    def _a_bed_event(self) -> tuple[Any, Any]:
        shelter = baker.make(Shelter, name="Append-Only Shelter")
        bed = baker.make(Bed, shelter=shelter, name="Append-Only Bed")
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

        self.assertIn("Cannot update or delete", str(ctx.exception))

    def test_delete_of_an_event_row_is_rejected(self) -> None:
        _, event = self._a_bed_event()

        with self.assertRaises(DatabaseError) as ctx:
            with transaction.atomic():
                _event_model(Bed).objects.filter(pk=event.pk).delete()

        self.assertIn("Cannot update or delete", str(ctx.exception))

    def test_inserting_event_rows_is_still_allowed(self) -> None:
        """`append_only` guards UPDATE/DELETE only; a normal write must succeed."""
        shelter = baker.make(Shelter, name="Still Writable")

        # Creating the bed writes a bed.add event via the trigger.
        bed = baker.make(Bed, shelter=shelter, name="Still Writable Bed")
        self.assertTrue(_event_model(Bed).objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.add").exists())

        # ...and updating the tracked model writes another event.
        bed.name = "Renamed Bed"
        bed.save()
        self.assertTrue(_event_model(Bed).objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.update").exists())

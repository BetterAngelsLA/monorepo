"""``apply_availability`` — the writer the API and the admin share.

The styleguide treats services as the primary test surface, so the writer's
contract is pinned here rather than only through the mutation and the form.
"""

from django.core.exceptions import ValidationError
from django.test import TestCase

from shelters.models import Shelter, ShelterAvailability
from shelters.services.availability import apply_availability


class ApplyAvailabilityTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Service Shelter", total_beds=10)

    def _row(self) -> ShelterAvailability:
        return ShelterAvailability.objects.get(shelter=self.shelter)

    def test_creates_the_row_when_it_is_missing(self) -> None:
        """A shelter predating the availability row gets one on first write."""
        ShelterAvailability.objects.filter(shelter=self.shelter).delete()

        returned = apply_availability(self.shelter, {"non_restricted_beds": 3, "restricted_beds": 1})

        self.assertIsNotNone(returned)
        self.assertEqual(ShelterAvailability.objects.filter(shelter=self.shelter).count(), 1)
        self.assertEqual(self._row().non_restricted_beds, 3)
        self.assertEqual(self._row().restricted_beds, 1)

    def test_writes_only_the_fields_the_payload_carries(self) -> None:
        apply_availability(self.shelter, {"non_restricted_beds": 4, "restriction_notes": "Women only"})

        apply_availability(self.shelter, {"restricted_beds": 2})

        row = self._row()
        self.assertEqual(row.non_restricted_beds, 4)
        self.assertEqual(row.restricted_beds, 2)
        self.assertEqual(row.restriction_notes, "Women only")

    def test_returns_none_when_nothing_writable_is_carried(self) -> None:
        """Unknown keys are ignored, and an empty payload writes nothing."""
        self.assertIsNone(apply_availability(self.shelter, {}))
        self.assertIsNone(apply_availability(self.shelter, {"shelter": 999}))

    def test_skips_the_write_when_the_value_already_matches(self) -> None:
        """An unrelated profile save must not add an availability audit event."""
        first = apply_availability(self.shelter, {"non_restricted_beds": 2})
        assert first is not None
        updated_at = first.updated_at

        again = apply_availability(self.shelter, {"non_restricted_beds": 2})
        assert again is not None

        again.refresh_from_db()
        self.assertEqual(again.updated_at, updated_at)

    def test_null_notes_clear_the_note(self) -> None:
        apply_availability(self.shelter, {"restriction_notes": "Clear me"})

        apply_availability(self.shelter, {"restriction_notes": None})

        self.assertEqual(self._row().restriction_notes, "")

    def test_rejects_counts_above_capacity_under_the_availability_path(self) -> None:
        with self.assertRaises(ValidationError) as raised:
            apply_availability(self.shelter, {"non_restricted_beds": 9, "restricted_beds": 2})

        self.assertEqual(
            set(raised.exception.error_dict),
            {"availability.non_restricted_beds", "availability.restricted_beds"},
        )
        self.assertEqual(self._row().non_restricted_beds, 0)

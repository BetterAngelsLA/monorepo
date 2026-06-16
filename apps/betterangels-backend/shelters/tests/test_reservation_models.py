import datetime

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone
from model_bakery import baker
from shelters.enums import BedStatusChoices, ReservationStatusChoices, RoomStatusChoices
from shelters.models import Bed, Reservation, Room, Shelter


class ReservationModelTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = baker.make(Shelter, name="Test Shelter")
        self.room = baker.make(Room, shelter=self.shelter, name="Room-101")
        self.room2 = baker.make(Room, shelter=self.shelter, name="Room-202")
        self.bed = baker.make(Bed, shelter=self.shelter, room=self.room, name="Bed-1")
        self.bed2 = baker.make(Bed, shelter=self.shelter, room=self.room2, name="Bed-2")

    # --- creation ---

    def test_can_create_bed_only_reservation(self) -> None:
        reservation = baker.make(Reservation, bed=self.bed)
        self.assertEqual(reservation.bed, self.bed)
        self.assertIsNone(reservation.room)
        self.assertEqual(reservation.status, ReservationStatusChoices.CONFIRMED)

    def test_can_create_room_only_reservation(self) -> None:
        reservation = baker.make(Reservation, room=self.room2, bed=None)
        self.assertEqual(reservation.room, self.room2)
        self.assertIsNone(reservation.bed)
        self.assertEqual(reservation.status, ReservationStatusChoices.CONFIRMED)

    # --- validation: requires bed or room ---

    def test_validates_requires_bed_or_room(self) -> None:
        with self.assertRaises(ValidationError) as ctx:
            Reservation(bed=None, room=None).clean()
        self.assertIn("A reservation must have a bed or room assigned.", str(ctx.exception))

    # --- double-booking prevention: bed ---

    def test_cannot_create_reservation_for_bed_with_confirmed_reservation(self) -> None:
        baker.make(Reservation, bed=self.bed, status=ReservationStatusChoices.CONFIRMED)
        with self.assertRaises(IntegrityError):
            baker.make(Reservation, bed=self.bed)

    def test_cannot_create_reservation_for_bed_with_checked_in_reservation(self) -> None:
        baker.make(Reservation, bed=self.bed, status=ReservationStatusChoices.CHECKED_IN)
        with self.assertRaises(IntegrityError):
            baker.make(Reservation, bed=self.bed)

    def test_cannot_create_reservation_for_bed_with_overdue_reservation(self) -> None:
        baker.make(Reservation, bed=self.bed, status=ReservationStatusChoices.CHECK_IN_OVERDUE)
        with self.assertRaises(IntegrityError):
            baker.make(Reservation, bed=self.bed)

    # --- double-booking prevention: room-only ---

    def test_cannot_create_second_room_only_reservation(self) -> None:
        """Room-only (bed=null) is unique per room for active reservations."""
        baker.make(Reservation, room=self.room2, bed=None, status=ReservationStatusChoices.CONFIRMED)
        with self.assertRaises(IntegrityError):
            baker.make(Reservation, room=self.room2, bed=None)

    def test_multiple_bed_reservations_allowed_for_same_room(self) -> None:
        """When both room and bed are set, the room constraint does not apply."""
        baker.make(Reservation, room=self.room, bed=self.bed, status=ReservationStatusChoices.CONFIRMED)
        baker.make(Reservation, room=self.room, bed=self.bed2, status=ReservationStatusChoices.CONFIRMED)
        self.assertEqual(Reservation.objects.filter(room=self.room).count(), 2)

    # --- completing a reservation sets checked_out_at ---

    def test_completing_reservation_sets_checked_out_at(self) -> None:
        reservation = baker.make(
            Reservation,
            bed=self.bed,
            status=ReservationStatusChoices.CHECKED_IN,
        )
        self.assertIsNone(reservation.checked_out_at)

        before = timezone.now()
        reservation.status = ReservationStatusChoices.COMPLETED
        reservation.save()
        after = timezone.now()

        reservation.refresh_from_db()
        self.assertIsNotNone(reservation.checked_out_at)
        assert reservation.checked_out_at is not None
        self.assertGreaterEqual(reservation.checked_out_at, before)
        self.assertLessEqual(reservation.checked_out_at, after)


class BedComputedStatusTestCase(TestCase):
    """
    Tests for Bed.computed_status based on Reservation checked_out_at / last_cleaned.
    """

    def setUp(self) -> None:
        self.shelter = baker.make(Shelter, name="Test Shelter")
        self.room = baker.make(Room, shelter=self.shelter, name="Room-101")

    def _make_bed(self, **kwargs: object) -> Bed:
        return baker.make(Bed, shelter=self.shelter, room=self.room, name="Bed-1", **kwargs)

    def _make_completed_reservation(self, bed: Bed, checked_out_at: datetime.datetime) -> Reservation:
        return baker.make(
            Reservation,
            bed=bed,
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at=checked_out_at,
        )

    def test_bed_with_checkout_after_last_cleaned_returns_in_turnaround(self) -> None:
        last_cleaned = datetime.datetime(2026, 1, 1, 12, 0, tzinfo=datetime.timezone.utc)
        checkout = datetime.datetime(2026, 1, 2, 12, 0, tzinfo=datetime.timezone.utc)
        bed = self._make_bed(last_cleaned=last_cleaned)
        self._make_completed_reservation(bed, checkout)
        self.assertEqual(bed.computed_status, BedStatusChoices.IN_TURNAROUND)

    def test_bed_with_checkout_before_last_cleaned_returns_available(self) -> None:
        last_cleaned = datetime.datetime(2026, 1, 2, 12, 0, tzinfo=datetime.timezone.utc)
        checkout = datetime.datetime(2026, 1, 1, 12, 0, tzinfo=datetime.timezone.utc)
        bed = self._make_bed(last_cleaned=last_cleaned)
        self._make_completed_reservation(bed, checkout)
        self.assertEqual(bed.computed_status, BedStatusChoices.AVAILABLE)

    def test_bed_with_checkout_and_maintenance_flag_returns_out_of_service(self) -> None:
        last_cleaned = datetime.datetime(2026, 1, 2, 12, 0, tzinfo=datetime.timezone.utc)
        checkout = datetime.datetime(2026, 1, 1, 12, 0, tzinfo=datetime.timezone.utc)
        bed = self._make_bed(
            last_cleaned=last_cleaned,
            maintenance_flag=True,
        )
        self._make_completed_reservation(bed, checkout)
        self.assertEqual(bed.computed_status, BedStatusChoices.OUT_OF_SERVICE)

    def test_bed_maintenance_flag_rejects_reservation(self) -> None:
        """Regression: reservation clean() uses maintenance_flag, not out_of_service."""
        bed = self._make_bed(maintenance_flag=True)
        with self.assertRaises(ValidationError) as ctx:
            Reservation(
                bed=bed,
                status=ReservationStatusChoices.CONFIRMED,
            ).clean()
        self.assertIn("bed", ctx.exception.message_dict)


class RoomComputedStatusTestCase(TestCase):
    """
    Tests for Room.computed_status based on Reservation checked_out_at / last_cleaned.
    """

    def setUp(self) -> None:
        self.shelter = baker.make(Shelter, name="Test Shelter")

    def _make_room(self, **kwargs: object) -> Room:
        return baker.make(Room, shelter=self.shelter, name="Room-Test", **kwargs)

    def _make_completed_reservation(self, room: Room, checked_out_at: datetime.datetime) -> Reservation:
        return baker.make(
            Reservation,
            room=room,
            bed=None,
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at=checked_out_at,
        )

    def test_room_with_checkout_after_last_cleaned_returns_in_turnaround(self) -> None:
        last_cleaned = datetime.datetime(2026, 1, 1, 12, 0, tzinfo=datetime.timezone.utc)
        checkout = datetime.datetime(2026, 1, 2, 12, 0, tzinfo=datetime.timezone.utc)
        room = self._make_room(last_cleaned=last_cleaned)
        self._make_completed_reservation(room, checkout)
        self.assertEqual(room.computed_status, RoomStatusChoices.IN_TURNAROUND)

    def test_room_with_checkout_before_last_cleaned_returns_available(self) -> None:
        last_cleaned = datetime.datetime(2026, 1, 2, 12, 0, tzinfo=datetime.timezone.utc)
        checkout = datetime.datetime(2026, 1, 1, 12, 0, tzinfo=datetime.timezone.utc)
        room = self._make_room(last_cleaned=last_cleaned)
        self._make_completed_reservation(room, checkout)
        self.assertEqual(room.computed_status, RoomStatusChoices.AVAILABLE)

    def test_room_with_checkout_and_maintenance_flag_returns_out_of_service(self) -> None:
        last_cleaned = datetime.datetime(2026, 1, 2, 12, 0, tzinfo=datetime.timezone.utc)
        checkout = datetime.datetime(2026, 1, 1, 12, 0, tzinfo=datetime.timezone.utc)
        room = self._make_room(last_cleaned=last_cleaned, maintenance_flag=True)
        self._make_completed_reservation(room, checkout)
        self.assertEqual(room.computed_status, RoomStatusChoices.OUT_OF_SERVICE)

    def test_room_with_no_checkout_and_no_maintenance_returns_available(self) -> None:
        room = self._make_room()
        self.assertEqual(room.computed_status, RoomStatusChoices.AVAILABLE)

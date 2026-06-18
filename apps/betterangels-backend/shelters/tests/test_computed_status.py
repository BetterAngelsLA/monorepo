"""Tests for computed bed/room status (Python rules, queryset annotation, filters)."""

import datetime

from django.test import TestCase
from django.utils import timezone
from model_bakery import baker
from shelters.enums import BedStatusChoices, ReservationStatusChoices, RoomStatusChoices
from shelters.models import Bed, Reservation, Room, Shelter
from shelters.status import compute_bed_status, compute_room_status


class ComputeBedStatusTestCase(TestCase):
    def test_out_of_service(self) -> None:
        self.assertEqual(
            compute_bed_status(
                maintenance_flag=True,
                last_cleaned=None,
                last_checkout=None,
                active_reservation_statuses=set(),
            ),
            BedStatusChoices.OUT_OF_SERVICE,
        )

    def test_in_turnaround(self) -> None:
        checkout = datetime.datetime(2026, 1, 2, 12, 0, tzinfo=datetime.timezone.utc)
        cleaned = datetime.datetime(2026, 1, 1, 12, 0, tzinfo=datetime.timezone.utc)
        self.assertEqual(
            compute_bed_status(
                maintenance_flag=False,
                last_cleaned=cleaned,
                last_checkout=checkout,
                active_reservation_statuses=set(),
            ),
            BedStatusChoices.IN_TURNAROUND,
        )

    def test_occupied_over_reserved(self) -> None:
        self.assertEqual(
            compute_bed_status(
                maintenance_flag=False,
                last_cleaned=None,
                last_checkout=None,
                active_reservation_statuses={ReservationStatusChoices.CHECKED_IN},
            ),
            BedStatusChoices.OCCUPIED,
        )

    def test_reserved(self) -> None:
        self.assertEqual(
            compute_bed_status(
                maintenance_flag=False,
                last_cleaned=None,
                last_checkout=None,
                active_reservation_statuses={ReservationStatusChoices.CONFIRMED},
            ),
            BedStatusChoices.RESERVED,
        )

    def test_available(self) -> None:
        self.assertEqual(
            compute_bed_status(
                maintenance_flag=False,
                last_cleaned=timezone.now(),
                last_checkout=timezone.now() - datetime.timedelta(days=1),
                active_reservation_statuses=set(),
            ),
            BedStatusChoices.AVAILABLE,
        )


class BedQuerySetComputedStatusTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = baker.make(Shelter, name="Test Shelter")
        self.room = baker.make(Room, shelter=self.shelter, name="Room-1")

    def test_annotation_matches_property(self) -> None:
        last_cleaned = datetime.datetime(2026, 1, 1, 12, 0, tzinfo=datetime.timezone.utc)
        checkout = datetime.datetime(2026, 1, 2, 12, 0, tzinfo=datetime.timezone.utc)
        bed = baker.make(Bed, shelter=self.shelter, room=self.room, last_cleaned=last_cleaned)
        baker.make(
            Reservation,
            bed=bed,
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at=checkout,
        )

        annotated = Bed.objects.with_computed_status().get(pk=bed.pk)
        self.assertEqual(annotated._computed_status, BedStatusChoices.IN_TURNAROUND)
        self.assertEqual(annotated.computed_status, BedStatusChoices.IN_TURNAROUND)

    def test_filter_by_status_reserved(self) -> None:
        bed = baker.make(Bed, shelter=self.shelter, room=self.room)
        other = baker.make(Bed, shelter=self.shelter, room=self.room, name="Other")
        baker.make(Reservation, bed=bed, status=ReservationStatusChoices.CONFIRMED)

        ids = set(Bed.objects.filter_by_status(BedStatusChoices.RESERVED).values_list("pk", flat=True))
        self.assertEqual(ids, {bed.pk})
        self.assertNotIn(other.pk, ids)


class ComputeRoomStatusTestCase(TestCase):
    def test_matches_bed_rules(self) -> None:
        checkout = datetime.datetime(2026, 1, 2, 12, 0, tzinfo=datetime.timezone.utc)
        cleaned = datetime.datetime(2026, 1, 1, 12, 0, tzinfo=datetime.timezone.utc)
        self.assertEqual(
            compute_room_status(
                maintenance_flag=False,
                last_cleaned=cleaned,
                last_checkout=checkout,
                active_reservation_statuses=set(),
            ),
            RoomStatusChoices.IN_TURNAROUND,
        )

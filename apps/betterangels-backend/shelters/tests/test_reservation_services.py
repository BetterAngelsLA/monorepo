import datetime

from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.test import TestCase
from model_bakery import baker
from shelters.enums import ReservationStatusChoices
from shelters.models import Bed, Reservation, Room
from shelters.services.reservation import reservation_create, reservation_delete, reservation_update
from shelters.tests.baker_recipes import shelter_recipe


class ReservationServiceTestCase(TestCase):
    def setUp(self) -> None:
        User = get_user_model()
        self.org = organization_recipe.make()
        self.other_org = organization_recipe.make()
        self.user = User.objects.create_user(username="reservation-service-user", password="pw")
        self.org.users.add(self.user)
        self.shelter = shelter_recipe.make(organization=self.org)
        self.room = baker.make(Room, shelter=self.shelter, name="Room-101")
        self.room2 = baker.make(Room, shelter=self.shelter, name="Room-202")
        self.bed = baker.make(Bed, shelter=self.shelter, room=self.room, name="Bed-1")
        self.bed2 = baker.make(Bed, shelter=self.shelter, room=self.room2, name="Bed-2")


class ReservationCreateTestCase(ReservationServiceTestCase):
    def test_creates_reservation_with_bed(self) -> None:
        reservation = reservation_create(
            user=self.user,
            data={"bed_id": self.bed.pk},
        )
        assert reservation.bed
        self.assertEqual(reservation.bed.shelter_id, self.shelter.pk)
        self.assertEqual(reservation.bed_id, self.bed.pk)
        self.assertIsNone(reservation.room_id)
        self.assertEqual(reservation.status, ReservationStatusChoices.CONFIRMED)
        self.assertTrue(Reservation.objects.filter(pk=reservation.pk).exists())

    def test_creates_room_only_reservation(self) -> None:
        reservation = reservation_create(
            user=self.user,
            data={"room_id": self.room2.pk},
        )

        assert reservation.room
        self.assertEqual(reservation.room.shelter_id, self.shelter.pk)
        self.assertEqual(reservation.room_id, self.room2.pk)
        self.assertIsNone(reservation.bed_id)
        self.assertEqual(reservation.status, ReservationStatusChoices.CONFIRMED)
        self.assertTrue(Reservation.objects.filter(pk=reservation.pk).exists())

    def test_requires_bed_or_room(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            reservation_create(user=self.user, data={})
        self.assertIn("A bed or room must be provided", str(ctx.exception))

    def test_bed_maintenance_flag_rejected(self) -> None:
        self.bed.maintenance_flag = True
        self.bed.save()

        with self.assertRaises(ValidationError) as ctx:
            reservation_create(
                user=self.user,
                data={"bed_id": self.bed.pk},
            )
        self.assertIn("bed", ctx.exception.message_dict)

    def test_bed_in_turnaround_rejected(self) -> None:
        now = datetime.datetime.now(datetime.timezone.utc)
        # Create a completed reservation with a checkout time after last_cleaned
        baker.make(
            Reservation,
            bed=self.bed,
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at=now + datetime.timedelta(hours=1),
        )

        with self.assertRaises(ValidationError) as ctx:
            reservation_create(
                user=self.user,
                data={"bed_id": self.bed.pk},
            )
        self.assertIn("bed", ctx.exception.message_dict)

    def test_room_maintenance_flag_rejected(self) -> None:
        self.room2.maintenance_flag = True
        self.room2.save()

        with self.assertRaises(ValidationError) as ctx:
            reservation_create(
                user=self.user,
                data={"room_id": self.room2.pk},
            )
        self.assertIn("room", ctx.exception.message_dict)

    def test_room_in_turnaround_rejected(self) -> None:
        now = datetime.datetime.now(datetime.timezone.utc)
        baker.make(
            Reservation,
            room=self.room2,
            bed=None,
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at=now + datetime.timedelta(hours=1),
        )

        with self.assertRaises(ValidationError) as ctx:
            reservation_create(
                user=self.user,
                data={"room_id": self.room2.pk},
            )
        self.assertIn("room", ctx.exception.message_dict)

    def test_duplicate_bed_rejected(self) -> None:
        baker.make(
            Reservation,
            bed=self.bed,
            status=ReservationStatusChoices.CONFIRMED,
        )

        with self.assertRaises(ValidationError):
            reservation_create(
                user=self.user,
                data={"bed_id": self.bed.pk},
            )

    def test_duplicate_room_rejected(self) -> None:
        baker.make(
            Reservation,
            room=self.room2,
            bed=None,
            status=ReservationStatusChoices.CONFIRMED,
        )

        with self.assertRaises(ValidationError):
            reservation_create(
                user=self.user,
                data={"room_id": self.room2.pk},
            )

    def test_user_without_org_access_raises(self) -> None:
        other_shelter = shelter_recipe.make(organization=self.other_org)
        other_bed = baker.make(Bed, shelter=other_shelter, name="Other-Bed")

        with self.assertRaises(ObjectDoesNotExist):
            reservation_create(user=self.user, data={"bed_id": other_bed.pk})


class ReservationUpdateTestCase(ReservationServiceTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.reservation = baker.make(
            Reservation,
            bed=self.bed,
            status=ReservationStatusChoices.CONFIRMED,
        )

    def test_updates_scalar_fields(self) -> None:
        updated = reservation_update(
            user=self.user,
            reservation_id=self.reservation.pk,
            data={
                "status": ReservationStatusChoices.CHECKED_IN,
                "notes": "Updated notes",
                "duration": 14,
            },
        )

        self.assertEqual(updated.pk, self.reservation.pk)
        self.assertEqual(updated.status, ReservationStatusChoices.CHECKED_IN)
        self.assertEqual(updated.notes, "Updated notes")
        self.assertEqual(updated.duration, 14)
        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.status, ReservationStatusChoices.CHECKED_IN)
        self.assertEqual(self.reservation.notes, "Updated notes")

    def test_updates_to_completed_sets_checked_out_at(self) -> None:
        self.assertIsNone(self.reservation.checked_out_at)

        updated = reservation_update(
            user=self.user,
            reservation_id=self.reservation.pk,
            data={"status": ReservationStatusChoices.COMPLETED},
        )

        self.assertIsNotNone(updated.checked_out_at)
        self.reservation.refresh_from_db()
        self.assertIsNotNone(self.reservation.checked_out_at)

    def test_updates_to_checked_in_sets_checked_in_at(self) -> None:
        self.assertIsNone(self.reservation.checked_in_at)

        updated = reservation_update(
            user=self.user,
            reservation_id=self.reservation.pk,
            data={"status": ReservationStatusChoices.CHECKED_IN},
        )

        self.assertIsNotNone(updated.checked_in_at)
        self.reservation.refresh_from_db()
        self.assertIsNotNone(self.reservation.checked_in_at)

    def test_none_scalar_values_skipped(self) -> None:
        reservation_update(
            user=self.user,
            reservation_id=self.reservation.pk,
            data={"notes": "New notes"},
        )

        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.notes, "New notes")
        self.assertEqual(self.reservation.status, ReservationStatusChoices.CONFIRMED)
        self.assertEqual(self.reservation.duration, None)

    def test_reservation_not_found_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            reservation_update(user=self.user, reservation_id=999999, data={"notes": "Missing"})
        self.assertIn("Reservation matching ID 999999 could not be found.", str(ctx.exception))

    def test_user_without_org_access_raises_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist):
            User = get_user_model()
            outsider = User.objects.create_user(username="outsider", password="pw")
            reservation_update(user=outsider, reservation_id=self.reservation.pk, data={"notes": "Blocked"})


class ReservationDeleteTestCase(ReservationServiceTestCase):
    def test_deletes_single_reservation(self) -> None:
        to_delete = baker.make(Reservation, bed=self.bed, status=ReservationStatusChoices.CONFIRMED)
        other = baker.make(Reservation, bed=self.bed2, status=ReservationStatusChoices.CONFIRMED)

        deleted = reservation_delete(user=self.user, ids=[to_delete.pk])

        self.assertEqual(len(deleted), 1)
        self.assertEqual(deleted[0], to_delete.pk)
        self.assertFalse(Reservation.objects.filter(pk=to_delete.pk).exists())
        self.assertTrue(Reservation.objects.filter(pk=other.pk).exists())

    def test_deletes_multiple_reservations(self) -> None:
        to_delete_1 = baker.make(Reservation, bed=self.bed, status=ReservationStatusChoices.CONFIRMED)
        to_delete_2 = baker.make(Reservation, bed=self.bed2, status=ReservationStatusChoices.CONFIRMED)
        other = baker.make(Reservation, room=self.room2, bed=None, status=ReservationStatusChoices.CONFIRMED)

        deleted = reservation_delete(user=self.user, ids=[to_delete_1.pk, to_delete_2.pk])

        self.assertEqual(len(deleted), 2)
        self.assertFalse(Reservation.objects.filter(pk__in=[to_delete_1.pk, to_delete_2.pk]).exists())
        self.assertTrue(Reservation.objects.filter(pk=other.pk).exists())

    def test_empty_list_returns_empty(self) -> None:
        deleted = reservation_delete(user=self.user, ids=[])
        self.assertEqual(deleted, [])

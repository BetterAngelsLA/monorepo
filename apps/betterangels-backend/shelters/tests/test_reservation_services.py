import datetime

from accounts.tests.baker_recipes import organization_recipe
from clients.models import ClientProfile
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import IntegrityError
from django.test import TestCase
from model_bakery import baker
from shelters.enums import ReservationStatusChoices
from shelters.models import Bed, Reservation, ReservationClient, Room
from shelters.services.reservation import (reservation_create,
                                           reservation_delete,
                                           reservation_update)
from shelters.tests.baker_recipes import shelter_recipe


class ReservationServiceTestCase(TestCase):
    def setUp(self) -> None:
        User = get_user_model()
        self.org = organization_recipe.make()
        self.other_org = organization_recipe.make()
        self.user = User.objects.create_user(username="reservation-service-user", password="pw")
        self.org.users.add(self.user)
        self.shelter = shelter_recipe.make(organization=self.org)
        self.room_1 = baker.make(Room, shelter=self.shelter, name="Room-101")
        self.room_2 = baker.make(Room, shelter=self.shelter, name="Room-202")
        self.bed_1 = baker.make(Bed, shelter=self.shelter, room=self.room_1, name="Bed-1")
        self.bed_2 = baker.make(Bed, shelter=self.shelter, room=self.room_2, name="Bed-2")
        self.client_1 = baker.make(ClientProfile)
        self.client_2 = baker.make(ClientProfile)


class ReservationCreateTestCase(ReservationServiceTestCase):
    def test_creates_reservation_with_bed(self) -> None:
        reservation = reservation_create(
            user=self.user,
            organization_id=self.org.pk,
            data={"bed_id": self.bed_1.pk, "clients": [{"client_profile_id": self.client_1.pk}]},
        )
        assert reservation.bed
        self.assertEqual(reservation.bed.shelter_id, self.shelter.pk)
        self.assertEqual(reservation.bed_id, self.bed_1.pk)
        self.assertIsNone(reservation.room_id)
        self.assertEqual(reservation.status, ReservationStatusChoices.CONFIRMED)
        self.assertTrue(Reservation.objects.filter(pk=reservation.pk).exists())

    def test_creates_room_only_reservation(self) -> None:
        reservation = reservation_create(
            user=self.user,
            organization_id=self.org.pk,
            data={"room_id": self.room_2.pk, "clients": [{"client_profile_id": self.client_1.pk}]},
        )

        assert reservation.room
        self.assertEqual(reservation.room.shelter_id, self.shelter.pk)
        self.assertEqual(reservation.room_id, self.room_2.pk)
        self.assertIsNone(reservation.bed_id)
        self.assertEqual(reservation.status, ReservationStatusChoices.CONFIRMED)
        self.assertTrue(Reservation.objects.filter(pk=reservation.pk).exists())

    def test_requires_bed_or_room(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            reservation_create(user=self.user, organization_id=self.org.pk, data={"clients": [{"client_profile_id": self.client_1.pk}]})
        self.assertIn("A bed or room must be provided", str(ctx.exception))

    def test_bed_maintenance_flag_rejected(self) -> None:
        self.bed_1.maintenance_flag = True
        self.bed_1.save()

        with self.assertRaises(ValidationError) as ctx:
            reservation_create(
                user=self.user,
                organization_id=self.org.pk,
                data={"bed_id": self.bed_1.pk, "clients": [{"client_profile_id": self.client_1.pk}]},
            )
        self.assertIn("bed", ctx.exception.message_dict)

    def test_bed_in_turnaround_rejected(self) -> None:
        now = datetime.datetime.now(datetime.timezone.utc)
        # Create a completed reservation with a checkout time after last_cleaned
        baker.make(
            Reservation,
            bed=self.bed_1,
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at=now + datetime.timedelta(hours=1),
        )

        with self.assertRaises(ValidationError) as ctx:
            reservation_create(
                user=self.user,
                organization_id=self.org.pk,
                data={"bed_id": self.bed_1.pk, "clients": [{"client_profile_id": self.client_1.pk}]},
            )
        self.assertIn("bed", ctx.exception.message_dict)

    def test_room_maintenance_flag_rejected(self) -> None:
        self.room_2.maintenance_flag = True
        self.room_2.save()

        with self.assertRaises(ValidationError) as ctx:
            reservation_create(
                user=self.user,
                organization_id=self.org.pk,
                data={"room_id": self.room_2.pk, "clients": [{"client_profile_id": self.client_1.pk}]},
            )
        self.assertIn("room", ctx.exception.message_dict)

    def test_room_in_turnaround_rejected(self) -> None:
        now = datetime.datetime.now(datetime.timezone.utc)
        baker.make(
            Reservation,
            room=self.room_2,
            bed=None,
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at=now + datetime.timedelta(hours=1),
        )

        with self.assertRaises(ValidationError) as ctx:
            reservation_create(
                user=self.user,
                organization_id=self.org.pk,
                data={"room_id": self.room_2.pk, "clients": [{"client_profile_id": self.client_1.pk}]},
            )
        self.assertIn("room", ctx.exception.message_dict)

    def test_duplicate_bed_rejected(self) -> None:
        baker.make(
            Reservation,
            bed=self.bed_1,
            status=ReservationStatusChoices.CONFIRMED,
        )

        with self.assertRaises(ValidationError):
            reservation_create(
                user=self.user,
                organization_id=self.org.pk,
                data={"bed_id": self.bed_1.pk, "clients": [{"client_profile_id": self.client_1.pk}]},
            )

    def test_duplicate_room_rejected(self) -> None:
        baker.make(
            Reservation,
            room=self.room_2,
            bed=None,
            status=ReservationStatusChoices.CONFIRMED,
        )

        with self.assertRaises(ValidationError):
            reservation_create(
                user=self.user,
            organization_id=self.org.pk,
                data={"room_id": self.room_2.pk, "clients": [{"client_profile_id": self.client_1.pk}]},
            )

    def test_user_without_org_access_raises(self) -> None:
        other_shelter = shelter_recipe.make(organization=self.other_org)
        other_bed = baker.make(Bed, shelter=other_shelter, name="Other-Bed")

        with self.assertRaises(ObjectDoesNotExist):
            reservation_create(
                user=self.user,
                organization_id=self.org.pk,
                data={"bed_id": other_bed.pk, "clients": [{"client_profile_id": self.client_1.pk}]}
            )

    def test_creates_reservation_with_clients(self) -> None:
        reservation = reservation_create(
            user=self.user,
            organization_id=self.org.pk,
            data={
                "bed_id": self.bed_1.pk,
                "clients": [
                    {"client_profile_id": self.client_1.pk, "is_primary": True},
                    {"client_profile_id": self.client_2.pk, "is_primary": False},
                ],
            },
        )

        self.assertEqual(reservation.clients.count(), 2)
        rc_1 = ReservationClient.objects.get(reservation=reservation, client_profile=self.client_1)
        self.assertTrue(rc_1.is_primary)
        rc_2 = ReservationClient.objects.get(reservation=reservation, client_profile=self.client_2)
        self.assertFalse(rc_2.is_primary)

    def test_duplicate_client_on_same_reservation_rejected(self) -> None:
        client = baker.make(ClientProfile)

        with self.assertRaises(IntegrityError):
            reservation_create(
                user=self.user,
                organization_id=self.org.pk,
                data={
                    "bed_id": self.bed_1.pk,
                    "clients": [
                        {"client_profile_id": client.pk},
                        {"client_profile_id": client.pk},
                    ],
                },
            )

    def test_create_reservation_without_clients_raises_validation_error(self) -> None:
        with self.assertRaises(ValidationError) as ctx:
            reservation_create(
                user=self.user,
                organization_id=self.org.pk,
                data={"bed_id": self.bed_1.pk},
            )
        self.assertIn("At least one client must be associated", str(ctx.exception))


class ReservationUpdateTestCase(ReservationServiceTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.reservation = baker.make(
            Reservation,
            bed=self.bed_1,
            status=ReservationStatusChoices.CONFIRMED,
        )

    def test_updates_scalar_fields(self) -> None:
        updated = reservation_update(
            user=self.user,
            organization_id=self.org.pk,
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
            organization_id=self.org.pk,
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
            organization_id=self.org.pk,
            reservation_id=self.reservation.pk,
            data={"status": ReservationStatusChoices.CHECKED_IN},
        )

        self.assertIsNotNone(updated.checked_in_at)
        self.reservation.refresh_from_db()
        self.assertIsNotNone(self.reservation.checked_in_at)

    def test_none_scalar_values_skipped(self) -> None:
        reservation_update(
            user=self.user,
            organization_id=self.org.pk,
            reservation_id=self.reservation.pk,
            data={"notes": "New notes"},
        )

        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.notes, "New notes")
        self.assertEqual(self.reservation.status, ReservationStatusChoices.CONFIRMED)
        self.assertEqual(self.reservation.duration, None)

    def test_reservation_not_found_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            reservation_update(user=self.user, organization_id=self.org.pk, reservation_id=999999, data={"notes": "Missing"})
        self.assertIn("Reservation matching ID 999999 could not be found.", str(ctx.exception))

    def test_user_without_org_access_raises_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist):
            User = get_user_model()
            outsider = User.objects.create_user(username="outsider", password="pw")
            reservation_update(user=outsider, reservation_id=self.reservation.pk, data={"notes": "Blocked"})

    def test_update_replaces_clients(self) -> None:
        client_1 = baker.make(ClientProfile)
        client_2 = baker.make(ClientProfile)
        client_3 = baker.make(ClientProfile)

        # First, attach client_1 and client_2
        reservation_update(
            user=self.user,
            organization_id=self.org.pk,
            reservation_id=self.reservation.pk,
            data={
                "clients": [
                    {"client_profile_id": client_1.pk, "is_primary": True},
                    {"client_profile_id": client_2.pk, "is_primary": False},
                ],
            },
        )

        self.assertEqual(self.reservation.clients.count(), 2)
        client_ids_before = set(self.reservation.clients.values_list("pk", flat=True))
        self.assertIn(client_1.pk, client_ids_before)
        self.assertIn(client_2.pk, client_ids_before)

        # Replace entirely: remove client_1/2, add client_3 as primary
        reservation_update(
            user=self.user,
            organization_id=self.org.pk,
            reservation_id=self.reservation.pk,
            data={
                "clients": [
                    {"client_profile_id": client_3.pk, "is_primary": True},
                ],
            },
        )

        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.clients.count(), 1)

        res_client = self.reservation.reservation_clients.first()
        assert res_client

        self.assertEqual(res_client.client_profile.pk, client_3.pk)
        self.assertTrue(res_client.is_primary)


class ReservationDeleteTestCase(ReservationServiceTestCase):
    def test_deletes_single_reservation(self) -> None:
        to_delete = baker.make(Reservation, bed=self.bed_1, status=ReservationStatusChoices.CONFIRMED)
        other = baker.make(Reservation, bed=self.bed_2, status=ReservationStatusChoices.CONFIRMED)

        deleted = reservation_delete(user=self.user, organization_id=self.org.pk, ids=[to_delete.pk])

        self.assertEqual(len(deleted), 1)
        self.assertEqual(deleted[0], to_delete.pk)
        self.assertFalse(Reservation.objects.filter(pk=to_delete.pk).exists())
        self.assertTrue(Reservation.objects.filter(pk=other.pk).exists())

    def test_deletes_multiple_reservations(self) -> None:
        to_delete_1 = baker.make(Reservation, bed=self.bed_1, status=ReservationStatusChoices.CONFIRMED)
        to_delete_2 = baker.make(Reservation, bed=self.bed_2, status=ReservationStatusChoices.CONFIRMED)
        other = baker.make(Reservation, room=self.room_2, bed=None, status=ReservationStatusChoices.CONFIRMED)

        deleted = reservation_delete(user=self.user, organization_id=self.org.pk, ids=[to_delete_1.pk, to_delete_2.pk])

        self.assertEqual(len(deleted), 2)
        self.assertFalse(Reservation.objects.filter(pk__in=[to_delete_1.pk, to_delete_2.pk]).exists())
        self.assertTrue(Reservation.objects.filter(pk=other.pk).exists())

    def test_empty_list_returns_empty(self) -> None:
        deleted = reservation_delete(user=self.user, organization_id=self.org.pk, ids=[])
        self.assertEqual(deleted, [])

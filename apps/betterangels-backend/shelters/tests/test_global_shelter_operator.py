"""Global Shelter Operator: cross-org access via bypasses_org_scoping (SDB-218).

See docs/global-shelter-operator-org-bypass.md for the design. These tests
cover the specific new behavior -- ordinary Shelter Operator behavior is
already covered by test_operator_queries.py / test_mutations.py / etc.
"""

from typing import Any

from accounts.models import PermissionGroup, PermissionGroupTemplate, User
from accounts.seed import sync_group_permissions
from accounts.tests.baker_recipes import organization_recipe
from clients.models import ClientProfile
from django.test import TestCase
from model_bakery import baker
from strawberry import ID

from shelters.enums import ShelterPhotoTypeChoices, StatusChoices
from shelters.groups import GLOBAL_SHELTER_OPERATOR
from shelters.models import Bed, Reservation, Room, Shelter, ShelterPhoto
from shelters.services.shelter_photo import delete_shelter_photos, update_shelter_photo
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase
from shelters.types.inputs import UpdateShelterPhotoInput


class GlobalShelterOperatorTestCase(ShelterTestCase, TestCase):
    """``self.org`` / ``self.operator`` come from ``ShelterTestCase``.

    ``self.other_org`` is a second shelter org the global operator is not a
    member of and has no org-scoped permission in -- everything below proves
    access to it comes solely from the org-bypass template, not membership.
    """

    def setUp(self) -> None:
        super().setUp()

        self.other_org = organization_recipe.make(name="Other Shelter Org", preset_names=["shelter"], owner_roles=())
        self.other_shelter = shelter_recipe.make(organization=self.other_org)
        self.other_room = baker.make(Room, shelter=self.other_shelter)
        self.other_bed = baker.make(Bed, shelter=self.other_shelter, room=self.other_room)

        self.global_operator = baker.make(User)
        global_template = PermissionGroupTemplate.objects.get(name=GLOBAL_SHELTER_OPERATOR.name)
        # Hosted on self.org -- an arbitrary choice, not membership in other_org.
        global_pg, _ = PermissionGroup.objects.get_or_create(organization=self.org, template=global_template)
        sync_group_permissions(organization=self.org)
        self.global_operator.groups.add(global_pg)

        # The header always stays on the operator's own org -- never other_org.
        self._set_active_org(self.org)
        self.graphql_client.force_login(self.global_operator)

    # ── Reads across orgs ────────────────────────────────────────────────

    def test_sees_shelter_in_other_org(self) -> None:
        response = self.execute_graphql("query { operatorShelters { results { id } } }")
        self.assertIsNone(response.get("errors"))
        ids = {r["id"] for r in response["data"]["operatorShelters"]["results"]}
        self.assertIn(str(self.other_shelter.pk), ids)

    def test_sees_bed_in_other_org(self) -> None:
        response = self.execute_graphql("query { beds { results { id } } }")
        self.assertIsNone(response.get("errors"))
        ids = {r["id"] for r in response["data"]["beds"]["results"]}
        self.assertIn(str(self.other_bed.pk), ids)

    def test_sees_room_in_other_org(self) -> None:
        response = self.execute_graphql("query { rooms { results { id } } }")
        self.assertIsNone(response.get("errors"))
        ids = {r["id"] for r in response["data"]["rooms"]["results"]}
        self.assertIn(str(self.other_room.pk), ids)

    def test_ordinary_operator_does_not_see_shelter_in_other_org(self) -> None:
        """Regression guard: the bypass code path doesn't affect an ordinary operator."""
        self.graphql_client.force_login(self.operator)
        response = self.execute_graphql("query { operatorShelters { results { id } } }")
        self.assertIsNone(response.get("errors"))
        ids = {r["id"] for r in response["data"]["operatorShelters"]["results"]}
        self.assertNotIn(str(self.other_shelter.pk), ids)

    def test_sees_reservation_in_other_org(self) -> None:
        reservation = baker.make(Reservation, bed=self.other_bed)
        response = self.execute_graphql("query { reservations { results { id } } }")
        self.assertIsNone(response.get("errors"))
        ids = {r["id"] for r in response["data"]["reservations"]["results"]}
        self.assertIn(str(reservation.pk), ids)

    def test_occupancy_metrics_in_other_org(self) -> None:
        """shelter_occupancy_metrics resolves a cross-org shelter via shelter_get(permission=VIEW)."""
        response = self.execute_graphql(
            """
            query ($shelterId: ID!) {
                shelterOccupancyMetrics(shelterId: $shelterId) {
                    shelterId
                }
            }
            """,
            {"shelterId": str(self.other_shelter.pk)},
        )
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["shelterOccupancyMetrics"]["shelterId"], str(self.other_shelter.pk))

    # ── Mutate-by-id in another org ──────────────────────────────────────

    def test_can_update_bed_in_other_org(self) -> None:
        mutation = """
            mutation ($id: ID!, $data: UpdateBedInput!) {
                updateBed(id: $id, data: $data) {
                    ... on BedType { id name }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        response = self.execute_graphql(mutation, {"id": str(self.other_bed.pk), "data": {"name": "Renamed"}})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["updateBed"]["name"], "Renamed")
        self.other_bed.refresh_from_db()
        self.assertEqual(self.other_bed.name, "Renamed")

    def test_can_delete_beds_in_other_org(self) -> None:
        mutation = """
            mutation ($data: BulkDeleteInput!) {
                deleteBeds(data: $data) {
                    ... on BulkDeleteResult { ids }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        response = self.execute_graphql(mutation, {"data": {"ids": [str(self.other_bed.pk)]}})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["deleteBeds"]["ids"], [str(self.other_bed.pk)])
        self.assertFalse(Bed.objects.filter(pk=self.other_bed.pk).exists())

    def test_can_clone_bed_in_other_org(self) -> None:
        mutation = """
            mutation ($id: ID!) {
                cloneBed(id: $id) {
                    ... on BedType { id shelter { id } }
                }
            }
        """
        response = self.execute_graphql(mutation, {"id": str(self.other_bed.pk)})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["cloneBed"]["shelter"]["id"], str(self.other_shelter.pk))

    def test_can_update_shelter_photo_in_other_org(self) -> None:
        """Exercises the Phase 5 fix (explicit permission=) together with the bypass."""
        photo = baker.make(ShelterPhoto, shelter=self.other_shelter, type=ShelterPhotoTypeChoices.EXTERIOR)

        updated = update_shelter_photo(
            user=self.global_operator,
            organization_id=str(self.org.id),
            data=UpdateShelterPhotoInput(id=ID(str(photo.pk)), photo_type=ShelterPhotoTypeChoices.INTERIOR),
        )

        self.assertEqual(updated.pk, photo.pk)
        photo.refresh_from_db()
        self.assertEqual(photo.type, ShelterPhotoTypeChoices.INTERIOR)

    def test_can_delete_shelter_photos_in_other_org(self) -> None:
        photo = baker.make(ShelterPhoto, shelter=self.other_shelter)

        deleted_ids = delete_shelter_photos(user=self.global_operator, organization_id=str(self.org.id), ids=[photo.pk])

        self.assertEqual(deleted_ids, [photo.pk])
        self.assertFalse(ShelterPhoto.objects.filter(pk=photo.pk).exists())

    # ── Creation transitively works via the parent object (no org input) ─

    def test_can_create_bed_in_other_org_shelter(self) -> None:
        mutation = """
            mutation ($data: CreateBedInput!) {
                createBed(data: $data) {
                    ... on BedType { id shelter { id } }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {"shelterId": str(self.other_shelter.pk), "roomId": str(self.other_room.pk), "name": "New Bed"}
        }
        response = self.execute_graphql(mutation, variables)
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createBed"]["shelter"]["id"], str(self.other_shelter.pk))

    def test_can_create_room_in_other_org_shelter(self) -> None:
        mutation = """
            mutation ($data: CreateRoomInput!) {
                createRoom(data: $data) {
                    ... on RoomType { id shelter { id } }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        variables: dict[str, Any] = {"data": {"shelterId": str(self.other_shelter.pk), "name": "New Room"}}
        response = self.execute_graphql(mutation, variables)
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createRoom"]["shelter"]["id"], str(self.other_shelter.pk))

    def test_can_create_reservation_in_other_org(self) -> None:
        client_profile = baker.make(ClientProfile)
        mutation = """
            mutation ($data: CreateReservationInput!) {
                createReservation(data: $data) {
                    ... on ReservationType { id shelter { id } }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "bedId": str(self.other_bed.pk),
                "startDate": "2026-01-01",
                "clients": [{"clientProfileId": str(client_profile.pk), "isPrimary": True}],
            }
        }
        response = self.execute_graphql(mutation, variables)
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createReservation"]["shelter"]["id"], str(self.other_shelter.pk))

    # ── create_shelter: the one mutation that needs an explicit target org ─

    def test_can_create_shelter_for_other_org(self) -> None:
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType { id organization { id } }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "name": "Shelter For Other Org",
                "description": "desc",
                "organizationId": str(self.other_org.id),
            }
        }
        response = self.execute_graphql(mutation, variables)
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createShelter"]["organization"]["id"], str(self.other_org.id))

    def test_can_create_shelter_for_own_org(self) -> None:
        """organization_id is allowed to equal the operator's own org -- not forbidden, just validated."""
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType { id organization { id } }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {"name": "Shelter For Own Org", "description": "desc", "organizationId": str(self.org.id)}
        }
        response = self.execute_graphql(mutation, variables)
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createShelter"]["organization"]["id"], str(self.org.id))

    def test_create_shelter_requires_organization_id(self) -> None:
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType { id }
                    ... on OperationInfo { messages { kind message } }
                }
            }
        """
        response = self.execute_graphql(
            mutation,
            {
                "data": {
                    "name": "No Org Shelter",
                    "description": "desc",
                }
            },
        )
        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createShelter"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn("organization_id is required", messages[0]["message"])
        self.assertFalse(Shelter.objects.filter(name="No Org Shelter").exists())

    def test_create_shelter_rejects_nonexistent_organization_id(self) -> None:
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType { id }
                    ... on OperationInfo { messages { kind message } }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "name": "Bogus Org Shelter",
                "description": "desc",
                "organizationId": "999999",
            }
        }
        response = self.execute_graphql(mutation, variables)
        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createShelter"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn("Organization with id 999999 not found", messages[0]["message"])

    def test_ordinary_operator_cannot_create_shelter_for_another_org(self) -> None:
        """Regression guard: organization_id isn't silently ignored for a non-bypass caller."""
        self.graphql_client.force_login(self.operator)
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType { id }
                    ... on OperationInfo { messages { kind message } }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "name": "Sneaky Org Shelter",
                "description": "desc",
                "organizationId": str(self.other_org.id),
            }
        }
        response = self.execute_graphql(mutation, variables)
        self.assertIsNone(response.get("errors"))
        self.assertGraphQLOperationInfo(
            response,
            "createShelter",
            "You do not have permission to create a shelter for that organization.",
            kind="PERMISSION",
        )
        self.assertFalse(Shelter.objects.filter(name="Sneaky Org Shelter").exists())

    # ── Regression guard: the bypass is permission-scoped, not role-wide ──

    def test_cannot_view_reports_in_other_org(self) -> None:
        """Global Shelter Operator doesn't hold ReportPermissions.VIEW_REPORTS -- proves the
        bypass can't be exploited beyond what the template's own permission list carries.
        """
        response = self.execute_graphql("query { reportSummary { totalNotes } }")
        self.assertIsNotNone(response.get("errors"))
        self.assertIn(
            "You do not have permission to perform this action in this organization.",
            response["errors"][0]["message"],
        )

    # ── Regression guard: pre-existing public-directory behavior is unaffected ─

    def test_sees_private_shelters_in_public_directory(self) -> None:
        """Unrelated to the org-bypass work -- confirms it isn't regressed.

        Global Shelter Operator already holds Shelter.perms.VIEW_PRIVATE, so this
        was already true via the public `shelters` query's plain user.has_perm()
        check (shelter_list), independent of permissioned_queryset entirely.
        """
        private_shelter = shelter_recipe.make(
            status=StatusChoices.APPROVED, is_private=True, organization=self.other_org
        )
        response = self.execute_graphql("query { shelters { results { id } } }")
        self.assertIsNone(response.get("errors"))
        ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(str(private_shelter.pk), ids)

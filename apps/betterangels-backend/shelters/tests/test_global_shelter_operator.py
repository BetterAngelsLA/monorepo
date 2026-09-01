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
from common.permissions.utils import user_holds_org_bypass_perms
from django.contrib.auth.models import Permission
from django.test import TestCase
from model_bakery import baker
from strawberry import ID
from teams.models import Team

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
        self.other_room = baker.make(Room, shelter=self.other_shelter, name="other room")
        self.other_bed = baker.make(Bed, shelter=self.other_shelter, room=self.other_room, name="other bed")

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

    def test_can_update_shelter_in_other_org(self) -> None:
        mutation = """
            mutation ($data: UpdateShelterInput!) {
                updateShelter(data: $data) {
                    ... on ShelterType { id name }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        response = self.execute_graphql(
            mutation,
            {"data": {"id": str(self.other_shelter.pk), "name": "Renamed Shelter"}},
        )
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["updateShelter"]["name"], "Renamed Shelter")
        self.other_shelter.refresh_from_db()
        self.assertEqual(self.other_shelter.name, "Renamed Shelter")

    def test_can_update_room_in_other_org(self) -> None:
        mutation = """
            mutation ($id: ID!, $data: UpdateRoomInput!) {
                updateRoom(id: $id, data: $data) {
                    ... on RoomType { id name }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        response = self.execute_graphql(mutation, {"id": str(self.other_room.pk), "data": {"name": "Renamed Room"}})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["updateRoom"]["name"], "Renamed Room")
        self.other_room.refresh_from_db()
        self.assertEqual(self.other_room.name, "Renamed Room")

    def test_can_delete_rooms_in_other_org(self) -> None:
        mutation = """
            mutation ($data: BulkDeleteInput!) {
                deleteRooms(data: $data) {
                    ... on BulkDeleteResult { ids }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        response = self.execute_graphql(mutation, {"data": {"ids": [str(self.other_room.pk)]}})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["deleteRooms"]["ids"], [str(self.other_room.pk)])
        self.assertFalse(Room.objects.filter(pk=self.other_room.pk).exists())

    def test_can_clone_room_in_other_org(self) -> None:
        mutation = """
            mutation ($id: ID!) {
                cloneRoom(id: $id) {
                    ... on RoomType { id shelter { id } }
                }
            }
        """
        response = self.execute_graphql(mutation, {"id": str(self.other_room.pk)})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["cloneRoom"]["shelter"]["id"], str(self.other_shelter.pk))

    def test_can_update_reservation_in_other_org(self) -> None:
        reservation = baker.make(Reservation, bed=self.other_bed)
        mutation = """
            mutation ($id: ID!, $data: UpdateReservationInput!) {
                updateReservation(id: $id, data: $data) {
                    ... on ReservationType { id notes }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        response = self.execute_graphql(mutation, {"id": str(reservation.pk), "data": {"notes": "Updated Notes"}})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["updateReservation"]["notes"], "Updated Notes")
        reservation.refresh_from_db()
        self.assertEqual(reservation.notes, "Updated Notes")

    def test_can_delete_reservations_in_other_org(self) -> None:
        reservation = baker.make(Reservation, bed=self.other_bed)
        mutation = """
            mutation ($data: BulkDeleteInput!) {
                deleteReservations(data: $data) {
                    ... on BulkDeleteResult { ids }
                    ... on OperationInfo { messages { message } }
                }
            }
        """
        response = self.execute_graphql(mutation, {"data": {"ids": [str(reservation.pk)]}})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["deleteReservations"]["ids"], [str(reservation.pk)])
        self.assertFalse(Reservation.objects.filter(pk=reservation.pk).exists())

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

    def test_cannot_add_organization_member(self) -> None:
        """GSO holds no org-member perms: addOrganizationMember must never run."""
        mutation = """
            mutation ($data: OrgInvitationInput!) {
                addOrganizationMember(data: $data) {
                    ... on OrganizationMemberType { id }
                    ... on OperationInfo { messages { kind message } }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "email": "gso-invite@example.com",
                "firstName": "GSO",
                "lastName": "Invite",
                "organizationId": str(self.org.id),
                "permissionTemplate": "SHELTER_OPERATOR",
            }
        }
        response = self.execute_graphql(mutation, variables)
        payload = (response.get("data") or {}).get("addOrganizationMember") or {}
        self.assertIsNone(payload.get("id"))
        self.assertFalse(User.objects.filter(email="gso-invite@example.com").exists())

    def test_cannot_change_organization_member_role(self) -> None:
        """GSO holds no org-member perms: changeOrganizationMemberRole must never run."""
        mutation = """
            mutation ($data: ChangeOrganizationMemberRoleInput!) {
                changeOrganizationMemberRole(data: $data) {
                    ... on OrganizationMemberType { id }
                    ... on OperationInfo { messages { kind message } }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "userId": str(self.operator.pk),
                "organizationId": str(self.org.id),
                "permissionTemplate": "SHELTER_OPERATOR",
            }
        }
        response = self.execute_graphql(mutation, variables)
        payload = (response.get("data") or {}).get("changeOrganizationMemberRole") or {}
        self.assertIsNone(payload.get("id"))

    def test_cannot_manage_teams_in_other_org(self) -> None:
        """GSO holds no teams.* perms: createTeam must never run."""
        mutation = """
            mutation ($data: CreateTeamInput!) {
                createTeam(data: $data) {
                    ... on TeamType { id }
                    ... on OperationInfo { messages { kind message } }
                }
            }
        """
        response = self.execute_graphql(mutation, {"data": {"name": "GSO Team"}})
        payload = (response.get("data") or {}).get("createTeam") or {}
        self.assertIsNone(payload.get("id"))
        self.assertFalse(Team.objects.filter(name="GSO Team").exists())

    def test_bypass_never_grants_permissions_not_on_the_template(self) -> None:
        """Exhaustive: the bypass cannot grant any permission the template lacks.

        ``user_holds_org_bypass_perms`` is the resolver-branch gate. Probing it
        with every permission the GSO config does *not* carry must return False
        each time — proving "can't do anything not in the template" directly
        rather than sampling a few surfaces. The config list (not the synced DB
        row) is the exclusion set, so an accidentally-synced extra permission
        would be caught here too.
        """
        template_perms = set(GLOBAL_SHELTER_OPERATOR.permissions)

        off_template = [
            f"{p.content_type.app_label}.{p.codename}"
            for p in Permission.objects.all()
            if f"{p.content_type.app_label}.{p.codename}" not in template_perms
        ]
        self.assertTrue(off_template, "the GSO template is not expected to carry every permission")

        for perm_str in off_template:
            self.assertFalse(
                user_holds_org_bypass_perms(self.global_operator, [perm_str]),
                f"bypass granted an off-template permission: {perm_str}",
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

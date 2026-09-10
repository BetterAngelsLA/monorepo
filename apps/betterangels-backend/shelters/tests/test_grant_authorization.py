"""Grant-authorization contract tests for the shelter domain (ADR 0001).

Shelters is the first domain cut over to the grant model: its reads and writes
are governed by the predicates in ``common.permissions.selectors``
(``visible`` / ``can`` / ``scopes``), not by legacy ``PermissionGroup`` rows
or request headers.

These tests pin the cross-cutting invariants that span features and are easy to
regress silently:

* global tier — a global-role holder reads across every org, never confined;
* finite reach — a scoped user sees exactly the orgs they hold a grant in
  (membership alone grants nothing);
* identity-wide writes — a grant at the row's org authorizes create / update /
  delete / clone regardless of which org the request is made in;
* target-org creates — the organization rides in the payload and must exist
  and carry the create grant;
* fail-closed semantics — an unauthorized row is indistinguishable from a
  missing one (404 / empty list);
* permission threading — delete paths require DELETE, clones require ADD.

Per-feature CRUD and permission behavior lives in the app's other test modules
(``test_mutations``, ``test_operator_queries``, ``test_room_*``,
``test_reservation_*``, ...).  This module is the cross-domain contract home
that other domains mirror when they cut over (ADR 0001 §7).
"""

from accounts.models import Role, User
from accounts.role_manager import OrgRoleManager
from accounts.services import grant_create, role_assign
from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ObjectDoesNotExist
from django.test import TestCase
from model_bakery import baker
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR
from shelters.models import Bed, Reservation, Room, Shelter
from shelters.selectors.operator import room_queryset, shelter_queryset
from shelters.services.room import room_delete
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase


class GlobalTierCrossOrgReadTestCase(TestCase):
    """A global-tier (global-role) holder reads shelters across every org."""

    def setUp(self) -> None:
        self.org_a = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.org_b = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.shelter_a = shelter_recipe.make(organization=self.org_a)
        self.shelter_b = shelter_recipe.make(organization=self.org_b)
        self.gso = baker.make(User)
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)

    def test_global_role_sees_shelters_in_every_org(self) -> None:
        role_assign(user=self.gso, role=self.gso_role)

        qs = shelter_queryset(Shelter.objects.all(), user=self.gso, permission=Shelter.perms.VIEW)

        self.assertEqual(qs.count(), 2)
        self.assertSetEqual(
            set(qs.values_list("pk", flat=True)),
            {self.shelter_a.pk, self.shelter_b.pk},
        )

    def test_scoped_user_sees_only_granted_orgs(self) -> None:
        user = baker.make(User)
        self.org_a.add_user(user)
        OrgRoleManager(self.org_a).add_roles(user, SHELTER_OPERATOR)

        qs = shelter_queryset(Shelter.objects.all(), user=user, permission=Shelter.perms.VIEW)

        self.assertEqual(list(qs.values_list("pk", flat=True)), [self.shelter_a.pk])


class CreateShelterWithTargetOrgTestCase(ShelterTestCase, TestCase):
    """createShelter accepts an explicit organization_id (ADR 0001 §2.6)."""

    MUTATION = """
        mutation ($data: CreateShelterInput!) {
            createShelter(data: $data) {
                ... on ShelterType {
                    id
                    name
                }
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    def test_create_with_explicit_organization_id(self) -> None:
        self.graphql_client.force_login(self.operator)

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "name": "Target Org Shelter",
                    "description": "created via explicit org id",
                    "organizationId": str(self.org.pk),
                }
            },
        )

        self.assertIsNone(response.get("errors"))
        shelter = response["data"]["createShelter"]
        self.assertEqual(shelter["name"], "Target Org Shelter")
        self.assertEqual(Shelter.objects.get(pk=shelter["id"]).organization_id, self.org.pk)

    def test_create_for_org_without_a_grant_is_rejected(self) -> None:
        other_org = organization_recipe.make()
        self.graphql_client.force_login(self.operator)

        response = self.execute_graphql(
            self.MUTATION,
            {"data": {"name": "Nope", "organizationId": str(other_org.pk)}},
        )

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createShelter"]["messages"]
        self.assertEqual(messages[0]["kind"], "PERMISSION")


class IdentityWideWritesTestCase(ShelterTestCase, TestCase):
    """Writes are identity-wide — the SHELTER_OPERATOR grant at org_b authorizes
    writes on org_b's rows (ADR 0001 §7.7).
    """

    UPDATE_MUTATION = """
        mutation UpdateShelter($data: UpdateShelterInput!) {
            updateShelter(data: $data) {
                ... on ShelterType {
                    id
                    name
                }
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    DELETE_MUTATION = """
        mutation DeleteShelter($id: ID!) {
            deleteShelter(id: $id) {
                ... on DeletedObjectType {
                    id
                }
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        # Grant the operator SHELTER_OPERATOR at org_b too, so they can reach
        # org_b's rows.
        self.org_b = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.org_b.users.add(self.operator)
        OrgRoleManager(self.org_b).add_roles(self.operator, SHELTER_OPERATOR)
        # Updates run model full_clean on the row, so the fixture needs a valid URL.
        self.shelter_b = shelter_recipe.make(organization=self.org_b, website="https://shelter-b.example.org")
        self.graphql_client.force_login(self.operator)

    def test_update_shelter_in_another_org_by_reach(self) -> None:
        """Reach at org_b (the operator holds SHELTER_OPERATOR there) lets them
        update org_b's shelter.
        """
        response = self.execute_graphql(
            self.UPDATE_MUTATION,
            {"data": {"id": str(self.shelter_b.pk), "description": "cross-org update"}},
        )

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["updateShelter"]["id"], str(self.shelter_b.pk))
        self.shelter_b.refresh_from_db()
        self.assertEqual(self.shelter_b.description, "cross-org update")

    def test_delete_shelter_in_another_org_by_reach(self) -> None:
        """Reach at org_b (the operator holds SHELTER_OPERATOR there) lets them
        delete org_b's shelter.
        """
        response = self.execute_graphql(
            self.DELETE_MUTATION,
            {"id": str(self.shelter_b.pk)},
        )

        self.assertIsNone(response.get("errors"))
        # DeletedObjectType.id is an int (see deleteShelter success tests).
        self.assertEqual(response["data"]["deleteShelter"]["id"], self.shelter_b.pk)
        self.assertFalse(Shelter.objects.filter(pk=self.shelter_b.pk).exists())


class IdentityWideReadsTestCase(ShelterTestCase, TestCase):
    """Operator reads are reach-scoped: rows in org_b resolve by id or list
    filter for an operator granted at org_b (ADR 0001 §7.7).
    """

    ROOM_Q = "query RoomQ($id: ID!){ room(pk:$id){ id } }"
    BED_Q = "query BedQ($id: ID!){ bed(pk:$id){ id } }"
    RESERVATION_Q = "query ReservationQ($id: ID!){ reservation(pk:$id){ id } }"
    ROOMS_LIST_Q = """
        query RoomsQ($filters: RoomFilter, $pagination: OffsetPaginationInput) {
            rooms(filters: $filters, pagination: $pagination) {
                totalCount
                results { id }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.org_b = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.org_b.users.add(self.operator)
        OrgRoleManager(self.org_b).add_roles(self.operator, SHELTER_OPERATOR)
        self.shelter_b = shelter_recipe.make(organization=self.org_b)
        self.room_b = baker.make(Room, shelter=self.shelter_b, name="Room-B")
        self.bed_b = baker.make(Bed, shelter=self.shelter_b, room=self.room_b, name="Bed-B")
        self.reservation_b = baker.make(Reservation, room=self.room_b, bed=self.bed_b, created_by=self.operator)
        self.graphql_client.force_login(self.operator)

    def test_room_by_pk_resolves_across_orgs(self) -> None:
        response = self.execute_graphql(self.ROOM_Q, {"id": str(self.room_b.pk)})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["room"]["id"], str(self.room_b.pk))

    def test_bed_by_pk_resolves_across_orgs(self) -> None:
        response = self.execute_graphql(self.BED_Q, {"id": str(self.bed_b.pk)})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["bed"]["id"], str(self.bed_b.pk))

    def test_reservation_by_pk_resolves_across_orgs(self) -> None:
        response = self.execute_graphql(self.RESERVATION_Q, {"id": str(self.reservation_b.pk)})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["reservation"]["id"], str(self.reservation_b.pk))

    def test_rooms_list_of_another_org_resolves(self) -> None:
        response = self.execute_graphql(
            self.ROOMS_LIST_Q,
            {"filters": {"shelterId": str(self.shelter_b.pk)}, "pagination": {"offset": 0, "limit": 10}},
        )
        self.assertIsNone(response.get("errors"))
        payload = response["data"]["rooms"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.room_b.pk))


class IdentityWideChildWritesTestCase(ShelterTestCase, TestCase):
    """Child writes (rooms/beds/reservations) are identity-wide: the org comes
    from the parent shelter, so reach at org_b authorizes (ADR 0001 §7.7).
    """

    CREATE_ROOM = """
        mutation CreateRoomB($data: CreateRoomInput!) {
            createRoom(data: $data) {
                ... on RoomType { id }
                ... on OperationInfo { messages { kind message } }
            }
        }
    """
    CREATE_BED = """
        mutation CreateBedB($data: CreateBedInput!) {
            createBed(data: $data) {
                ... on BedType { id }
                ... on OperationInfo { messages { kind message } }
            }
        }
    """
    UPDATE_ROOM = """
        mutation UpdateRoomB($data: UpdateRoomInput!) {
            updateRoom(data: $data) {
                ... on RoomType { id name }
                ... on OperationInfo { messages { kind message } }
            }
        }
    """
    CLONE_ROOM = """
        mutation CloneRoomB($id: ID!) {
            cloneRoom(id: $id) {
                ... on RoomType { id }
                ... on OperationInfo { messages { kind message } }
            }
        }
    """
    DELETE_BEDS = """
        mutation DeleteBedsB($data: BulkDeleteInput!) {
            deleteBeds(data: $data) {
                ... on BulkDeleteResult { ids }
                ... on OperationInfo { messages { kind message } }
            }
        }
    """
    DELETE_RESERVATIONS = """
        mutation DeleteReservationsB($data: BulkDeleteInput!) {
            deleteReservations(data: $data) {
                ... on BulkDeleteResult { ids }
                ... on OperationInfo { messages { kind message } }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.org_b = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.org_b.users.add(self.operator)
        OrgRoleManager(self.org_b).add_roles(self.operator, SHELTER_OPERATOR)
        self.shelter_b = shelter_recipe.make(organization=self.org_b)
        self.room_b = baker.make(Room, shelter=self.shelter_b, name="Room-B")
        self.bed_b = baker.make(Bed, shelter=self.shelter_b, room=self.room_b, name="Bed-B")
        self.reservation_b = baker.make(Reservation, room=self.room_b, bed=self.bed_b, created_by=self.operator)
        self.graphql_client.force_login(self.operator)

    def test_create_room_under_another_orgs_shelter(self) -> None:
        response = self.execute_graphql(
            self.CREATE_ROOM, {"data": {"shelterId": str(self.shelter_b.pk), "name": "Room-B2"}}
        )
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["createRoom"].get("id"))

    def test_create_bed_under_another_orgs_shelter(self) -> None:
        response = self.execute_graphql(
            self.CREATE_BED, {"data": {"shelterId": str(self.shelter_b.pk), "name": "Bed-B2"}}
        )
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["createBed"].get("id"))

    def test_update_room_in_another_org(self) -> None:
        response = self.execute_graphql(
            self.UPDATE_ROOM, {"data": {"id": str(self.room_b.pk), "name": "Room-B Renamed"}}
        )
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["updateRoom"]["name"], "Room-B Renamed")
        self.room_b.refresh_from_db()
        self.assertEqual(self.room_b.name, "Room-B Renamed")

    def test_clone_room_in_another_org(self) -> None:
        response = self.execute_graphql(self.CLONE_ROOM, {"id": str(self.room_b.pk)})
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["cloneRoom"].get("id"))

    def test_delete_bed_in_another_org(self) -> None:
        response = self.execute_graphql(self.DELETE_BEDS, {"data": {"ids": [str(self.bed_b.pk)]}})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["deleteBeds"]["ids"], [str(self.bed_b.pk)])
        self.assertFalse(Bed.objects.filter(pk=self.bed_b.pk).exists())

    def test_delete_reservation_in_another_org(self) -> None:
        response = self.execute_graphql(self.DELETE_RESERVATIONS, {"data": {"ids": [str(self.reservation_b.pk)]}})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["deleteReservations"]["ids"], [str(self.reservation_b.pk)])
        self.assertFalse(Reservation.objects.filter(pk=self.reservation_b.pk).exists())


class PermissionThreadedMutationsTestCase(TestCase):
    """Mutations thread the exact permission (e.g. DELETE for deletes)."""

    def setUp(self) -> None:
        self.user = baker.make(User)
        self.org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.org.add_user(self.user)
        self.shelter = shelter_recipe.make(organization=self.org)
        self.room = baker.make(Room, shelter=self.shelter, name="Room-1")
        # A role carrying VIEW but NOT DELETE.
        self.view_role, _ = Role.objects.get_or_create(name="Test Room Viewer", is_global=False)
        app_label, codename = Room.perms.VIEW.split(".")
        from django.contrib.auth.models import Permission

        view_perm = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        self.view_role.permissions.add(view_perm)
        grant_create(user=self.user, role=self.view_role, scope_org=self.org)

    def test_room_delete_requires_delete_permission(self) -> None:
        # The user can VIEW the room...
        qs = room_queryset(Room.objects.all(), user=self.user, permission=Room.perms.VIEW)
        self.assertEqual(list(qs.values_list("pk", flat=True)), [self.room.pk])

        # ...but the delete path threads DELETE and fails closed.
        with self.assertRaises(ObjectDoesNotExist):
            room_delete(user=self.user, room_ids=[self.room.pk])

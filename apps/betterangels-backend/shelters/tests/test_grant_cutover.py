"""PR 4 shelter cutover: grant-based selectors/mutations govern the shelter domain.

Covers the behaviors that changed when the shelter domain flipped from
``permissioned_queryset``/``HasOrgPerm`` to the grant selectors (ADR 0001 §2.4,
§2.6): global-tier cross-org reads, target-org creates, and permission-threaded
mutations failing closed.
"""

from accounts.models import Role, User
from accounts.role_manager import OrgRoleManager
from accounts.services import grant_create, role_assign
from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ObjectDoesNotExist
from django.test import TestCase
from model_bakery import baker
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR
from shelters.models import Room, Shelter
from shelters.selectors.operator import room_queryset, shelter_queryset
from shelters.services.room import room_delete
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase


class GlobalTierCrossOrgReadTestCase(TestCase):
    """A global-tier holder reads shelters across every org — no header needed."""

    def setUp(self) -> None:
        self.org_a = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.org_b = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.shelter_a = shelter_recipe.make(organization=self.org_a)
        self.shelter_b = shelter_recipe.make(organization=self.org_b)
        self.gso = baker.make(User)
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)

    def test_gso_sees_shelters_in_every_org_without_a_header(self) -> None:
        role_assign(user=self.gso, role=self.gso_role)

        qs = shelter_queryset(Shelter.objects.all(), user=self.gso, organization_id=None, perms=[Shelter.perms.VIEW])

        self.assertEqual(qs.count(), 2)
        self.assertSetEqual(
            set(qs.values_list("pk", flat=True)),
            {self.shelter_a.pk, self.shelter_b.pk},
        )

    def test_scoped_user_without_header_sees_only_granted_orgs(self) -> None:
        user = baker.make(User)
        self.org_a.add_user(user)
        OrgRoleManager(self.org_a).add_roles(user, SHELTER_OPERATOR)

        qs = shelter_queryset(Shelter.objects.all(), user=user, organization_id=None, perms=[Shelter.perms.VIEW])

        self.assertEqual(list(qs.values_list("pk", flat=True)), [self.shelter_a.pk])

    def test_gso_header_never_confines_the_global_tier(self) -> None:
        """A stale header must not confine a global holder (ADR 0001 §2.4)."""
        role_assign(user=self.gso, role=self.gso_role)

        qs = shelter_queryset(
            Shelter.objects.all(),
            user=self.gso,
            organization_id=str(self.org_a.pk),
            perms=[Shelter.perms.VIEW],
        )

        self.assertEqual(qs.count(), 2)


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

    def test_create_with_organization_id_without_header(self) -> None:
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
        qs = room_queryset(
            Room.objects.all(), user=self.user, organization_id=str(self.org.pk), perms=[Room.perms.VIEW]
        )
        self.assertEqual(list(qs.values_list("pk", flat=True)), [self.room.pk])

        # ...but the delete path threads DELETE and fails closed.
        with self.assertRaises(ObjectDoesNotExist):
            room_delete(user=self.user, organization_id=str(self.org.pk), room_ids=[self.room.pk])

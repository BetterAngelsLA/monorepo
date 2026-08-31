"""HasOrgPerm must match the user's group against the permission-holding group.

``Organization.permission_groups`` is multi-valued, so two chained ``.filter()``
calls on it build independent joins and can be satisfied by different groups.
That made ``HasOrgPerm(X)`` mean "the user is in some group of this org, and
some group of this org has X" — and since every org is provisioned with every
template, effectively "any member holds every permission in their org".
"""

import uuid

from accounts.groups import ORG_ADMIN
from accounts.models import PermissionGroup, User
from accounts.role_manager import OrgRoleManager
from accounts.tests.baker_recipes import organization_recipe
from common.permissions.utils import permissioned_queryset
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from django.test import TestCase, ignore_warnings
from model_bakery import baker
from organizations.models import Organization
from teams.models import Team

CREATE_TEAM = """
    mutation ($data: CreateTeamInput!) {
        createTeam(data: $data) {
            ... on OperationInfo { messages { kind field message } }
            ... on TeamType { id name }
        }
    }
"""


@ignore_warnings(category=UserWarning)
class OrgPermSameGroupTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        # Provision the Org Admin template for org_1 so the org holds a group
        # carrying teams.* — the permissions the caseworker must NOT inherit.
        self.org_1_admin = baker.make(User, username=f"org_admin_{uuid.uuid4()}")
        self.org_1.add_user(self.org_1_admin)
        OrgRoleManager(self.org_1).add_roles(self.org_1_admin, ORG_ADMIN)

        self._set_active_org(self.org_1)

    def _create_team(self, name: str) -> dict:
        return self.execute_graphql(CREATE_TEAM, {"data": {"name": name}})

    def test_org_admin_can_create_a_team(self) -> None:
        """The permission still works for the group that actually holds it."""
        self.graphql_client.force_login(self.org_1_admin)

        response = self._create_team("Admin Team")

        team_id = response["data"]["createTeam"]["id"]
        self.assertEqual(Team.objects.get(pk=team_id).organization_id, self.org_1.pk)

    def test_caseworker_cannot_create_a_team(self) -> None:
        """A caseworker holds no teams.* perms, even though Org Admin does."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self._create_team("Caseworker Team")

        payload = (response.get("data") or {}).get("createTeam") or {}
        self.assertIsNone(payload.get("id"))
        self.assertEqual(Team.objects.filter(name="Caseworker Team").count(), 0)


class PermissionedQuerysetSameGroupTestCase(TestCase):
    """Direct coverage of the helper, independent of any app's mutations.

    The end-to-end case above goes through ``createTeam``; this pins the same
    rule at the level the fix lives, so it still holds if that mutation changes.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make(name="perm_same_group_org")
        self.user = baker.make(User, username=f"member_{uuid.uuid4()}")
        self.org.add_user(self.user)

        groups = list(PermissionGroup.objects.filter(organization=self.org)[:2])
        assert len(groups) >= 2, "the org recipe should provision at least two permission groups"
        self.member_group, self.holder_group = groups[0], groups[1]

        permission = Permission.objects.exclude(pk__in=self.member_group.permissions.values("pk")).first()
        assert permission is not None
        self.permission = permission

        # The permission lives in one group; the user belongs to the other.
        self.holder_group.permissions.add(self.permission)
        self.member_group.user_set.add(self.user)

    def _matches(self) -> bool:
        perm = f"{self.permission.content_type.app_label}.{self.permission.codename}"
        return permissioned_queryset(
            Organization.objects.all(),
            user=self.user,
            organization_id=str(self.org.pk),
            perms=[perm],
            organization_field="pk",
        ).exists()

    def test_membership_in_one_group_does_not_borrow_another_groups_permission(self) -> None:
        self.assertFalse(self._matches())

    def test_membership_in_the_holding_group_matches(self) -> None:
        self.holder_group.user_set.add(self.user)

        self.assertTrue(self._matches())

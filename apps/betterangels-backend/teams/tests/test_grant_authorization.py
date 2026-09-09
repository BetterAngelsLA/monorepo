"""Teams write authority — grant-only (ADR 0001 §5.3, teams cutover).

The three team mutations authorize through ``require_can`` — the grant
predicate (``can()``) — since ``ORG_ADMIN`` / ``ORG_SUPERUSER`` are role-backed
with backfilled Grants.  These tests pin the grant-only contract:

- a role-backed ORG_ADMIN (Grant mirrored by ``OrgRoleManager``) manages teams;
- a legacy-only ORG_ADMIN (PermissionGroup membership, no Grant) is DENIED —
  the flipped behavior that made the cutover grant-only;
- a scoped-Grant holder with no legacy group manages teams via the grant arm;
- update/delete thread CHANGE/DELETE (a holder of ADD alone cannot update/delete);
- a member with neither authority is denied;
- a Grant at org A does not authorize acting at org B;
- the global tier (superuser) is enforceable at any org.
"""

from accounts.groups import ORG_ADMIN
from accounts.models import PermissionGroup, User
from accounts.role_manager import OrgRoleManager
from accounts.services import sync_roles
from model_bakery import baker
from teams.models import Team

from .utils import TeamGraphQLUtilsMixin

PERMISSION_DENIED = "You do not have permission to perform this action in this organization."


class TeamGrantAuthorityTestCase(TeamGraphQLUtilsMixin):
    """Grant holders manage teams after the grant-only cutover."""

    def setUp(self) -> None:
        super().setUp()
        # Provision the code-owned Role rows so OrgRoleManager mirrors Grants
        # for role-backed ORG_ADMIN memberships.
        sync_roles()
        self.org_1_admin = baker.make(User)
        self.org_1.add_user(self.org_1_admin)
        OrgRoleManager(self.org_1).add_roles(self.org_1_admin, ORG_ADMIN)

        self.graphql_client.force_login(self.org_1_admin)
        self._set_active_org(self.org_1)

    def test_role_backed_org_admin_can_manage_teams(self) -> None:
        # Sanity: the mirrored Grant is what authorizes — nothing else.
        self.assertTrue(self.org_1_admin.grants.filter(scope_org=self.org_1, role__name=ORG_ADMIN.name).exists())

        response = self.create_team_fixture({"name": "grant-era team"})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createTeam"]["name"], "grant-era team")

        team = Team.objects.get(name="grant-era team")
        response = self.update_team_fixture({"id": team.pk, "name": "renamed"})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["updateTeam"]["name"], "renamed")

        response = self.delete_team_fixture(team.pk)
        self.assertIsNone(response.get("errors"))
        self.assertFalse(Team.objects.filter(pk=team.pk).exists())

    def test_scoped_grant_holder_with_no_legacy_group_can_manage_teams(self) -> None:
        """A scoped Grant alone authorizes — no legacy PermissionGroup needed."""
        grant_user = baker.make(User)
        self.org_1.add_user(grant_user)
        for perm in (Team.perms.ADD, Team.perms.CHANGE, Team.perms.DELETE):
            self._grant_permission(grant_user, str(perm), self.org_1, role_name="Team Admin")

        self.graphql_client.force_login(grant_user)
        self._set_active_org(self.org_1)

        response = self.create_team_fixture({"name": "grant-only team"})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createTeam"]["name"], "grant-only team")

        team = Team.objects.get(name="grant-only team")
        response = self.update_team_fixture({"id": team.pk, "name": "renamed"})
        self.assertIsNone(response.get("errors"))
        response = self.delete_team_fixture(team.pk)
        self.assertIsNone(response.get("errors"))
        self.assertFalse(Team.objects.filter(pk=team.pk).exists())

    def test_superuser_can_manage_teams_at_an_org(self) -> None:
        """The global tier is enforceable per org for the grant-only teams domain."""
        user = baker.make(User, is_superuser=True)
        self.org_1.add_user(user)
        self.graphql_client.force_login(user)
        self._set_active_org(self.org_1)

        response = self.create_team_fixture({"name": "superuser team"})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createTeam"]["name"], "superuser team")


class TeamGrantAuthorityDeniedTestCase(TeamGraphQLUtilsMixin):
    """Authority absent: legacy-only holders, ADD-only holders, members, cross-org."""

    def setUp(self) -> None:
        super().setUp()
        sync_roles()

    def _login(self, user: User, org: object) -> None:
        self.graphql_client.force_login(user)
        self._set_active_org(org)

    def test_legacy_only_org_admin_is_denied(self) -> None:
        """A legacy PermissionGroup ORG_ADMIN with no Grant no longer manages teams."""
        legacy_admin = baker.make(User)
        self.org_1.add_user(legacy_admin)
        group = PermissionGroup.objects.get(organization=self.org_1, template__name=ORG_ADMIN.name)
        group.user_set.add(legacy_admin)
        self.assertFalse(legacy_admin.grants.filter(scope_org=self.org_1).exists())

        self._login(legacy_admin, self.org_1)
        initial_count = Team.objects.count()

        response = self.create_team_fixture({"name": "should not appear"})
        self.assertGraphQLOperationInfo(response, "createTeam", PERMISSION_DENIED, kind="PERMISSION")
        self.assertEqual(Team.objects.count(), initial_count)

        # update/delete are denied too.
        team = baker.make(Team, name="existing", organization=self.org_1)
        response = self.update_team_fixture({"id": team.pk, "name": "nope"})
        self.assertGraphQLOperationInfo(response, "updateTeam", PERMISSION_DENIED, kind="PERMISSION")
        response = self.delete_team_fixture(team.pk)
        self.assertGraphQLOperationInfo(response, "deleteTeam", PERMISSION_DENIED, kind="PERMISSION")

    def test_grant_holder_with_only_add_cannot_update_or_delete(self) -> None:
        """Mutations thread the exact permission: CHANGE/DELETE, not just ADD."""
        add_only = baker.make(User)
        self.org_1.add_user(add_only)
        self._grant_permission(add_only, str(Team.perms.ADD), self.org_1, role_name="Team Creator")

        team = baker.make(Team, name="name", organization=self.org_1)

        self._login(add_only, self.org_1)
        create_response = self.create_team_fixture({"name": "created"})
        self.assertIsNone(create_response.get("errors"))

        update_response = self.update_team_fixture({"id": team.pk, "name": "nope"})
        self.assertGraphQLOperationInfo(update_response, "updateTeam", PERMISSION_DENIED, kind="PERMISSION")

        delete_response = self.delete_team_fixture(team.pk)
        self.assertGraphQLOperationInfo(delete_response, "deleteTeam", PERMISSION_DENIED, kind="PERMISSION")

    def test_member_with_no_authority_is_denied(self) -> None:
        member = baker.make(User)
        self.org_1.add_user(member)
        self._login(member, self.org_1)

        initial_count = Team.objects.count()
        response = self.create_team_fixture({"name": "should not appear"})
        self.assertGraphQLOperationInfo(response, "createTeam", PERMISSION_DENIED, kind="PERMISSION")
        self.assertEqual(Team.objects.count(), initial_count)

    def test_grant_at_org_a_does_not_authorize_org_b(self) -> None:
        """The role-backed ORG_ADMIN holds org_1 only; acting at org_2 must fail."""
        admin = baker.make(User)
        self.org_1.add_user(admin)
        OrgRoleManager(self.org_1).add_roles(admin, ORG_ADMIN)

        self._login(admin, self.org_2)
        response = self.create_team_fixture({"name": "wrong org"})
        self.assertGraphQLOperationInfo(response, "createTeam", PERMISSION_DENIED, kind="PERMISSION")

"""Teams authority — grant-only reads + writes (ADR 0001 §5.3, teams cutover).

The three team mutations authorize through ``require_can`` — the grant
predicate (``can()``) — since ``ORG_ADMIN`` / ``ORG_SUPERUSER`` are role-backed
with backfilled Grants.  The ``teams`` read is grant-only too: CASEWORKER is
role-backed with ``teams.view_team`` (RFC 0003 first step) so the workers who
pick teams on notes/tasks read via grants.  These tests pin the contract:

- a role-backed ORG_ADMIN (Grant mirrored by ``OrgRoleManager``) manages teams;
- a legacy-only ORG_ADMIN (PermissionGroup membership, no Grant) is DENIED —
  the flipped behavior that made the cutover grant-only;
- a scoped-Grant holder with no legacy group manages teams via the grant arm;
- update/delete thread CHANGE/DELETE (a holder of ADD alone cannot update/delete);
- a member with neither authority is denied;
- a Grant at org A does not authorize acting at org B;
- the global tier (superuser) is enforceable at any org;
- the read: role-backed caseworker / ORG_ADMIN, a direct-grant holder, or a
  superuser lists the org's teams; a member without a Grant is denied.
"""

from typing import Any

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


class TeamReadGrantAuthorityTestCase(TeamGraphQLUtilsMixin):
    """The ``teams`` read is grant-only: ``can(user, teams.view_team, org)``.

    Workers pick teams on notes/tasks, so CASEWORKER is role-backed with
    ``teams.view_team`` and backfilled — a role-backed caseworker reads; any
    holder of a ``teams.view_team`` Grant (or the global tier via superuser)
    reads, member or not; a user with no Grant is denied (membership is not
    consulted).
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.team = baker.make(Team, name="org-2 team", organization=self.org_2)

    def _list_org_2(self, user: User) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        self._set_active_org(self.org_2)
        return self.execute_graphql(self.get_teams_query())

    def _ids(self, response: dict[str, Any]) -> set[int]:
        self.assertIsNone(response.get("errors"))
        return {int(row["id"]) for row in response["data"]["teams"]["results"]}

    def _expected_ids(self) -> set[int]:
        """All teams of org_2 — the base fixture seeds one, tests may add more."""
        return set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))

    def test_role_backed_caseworker_can_list_teams(self) -> None:
        """A member caseworker reads via the mirrored CASEWORKER Grant."""
        from notes.groups import CASEWORKER

        worker = baker.make(User)
        self.org_2.add_user(worker)
        OrgRoleManager(self.org_2).add_roles(worker, CASEWORKER)
        self.assertTrue(worker.grants.filter(scope_org=self.org_2, role__name=CASEWORKER.name).exists())

        response = self._list_org_2(worker)
        self.assertEqual(self._ids(response), self._expected_ids())

    def test_role_backed_org_admin_can_list_teams(self) -> None:
        """An ORG_ADMIN member reads via the ORG_ADMIN Grant."""
        admin = baker.make(User)
        self.org_2.add_user(admin)
        OrgRoleManager(self.org_2).add_roles(admin, ORG_ADMIN)

        response = self._list_org_2(admin)
        self.assertEqual(self._ids(response), self._expected_ids())

    def test_non_member_with_view_grant_can_list_teams(self) -> None:
        """A direct-grant holder with no membership reads the org's teams."""
        holder = baker.make(User)
        self._grant_permission(holder, str(Team.perms.VIEW), self.org_2, role_name="Team Reader")
        self.assertFalse(self.org_2.users.filter(pk=holder.pk).exists())

        response = self._list_org_2(holder)
        self.assertEqual(self._ids(response), self._expected_ids())

    def test_superuser_without_membership_can_list_teams(self) -> None:
        """The global tier is enforceable at any org for the grant-only teams domain."""
        user = baker.make(User, is_superuser=True)
        self.assertFalse(self.org_2.users.filter(pk=user.pk).exists())

        response = self._list_org_2(user)
        self.assertEqual(self._ids(response), self._expected_ids())

    def test_member_without_grant_is_denied(self) -> None:
        """Membership alone no longer reads — the read is grant-only."""
        member = baker.make(User)
        self.org_2.add_user(member)
        self.assertFalse(member.grants.filter(scope_org=self.org_2).exists())

        response = self._list_org_2(member)
        self.assertIsNotNone(response.get("errors"))
        self.assertIsNone((response.get("data") or {}).get("teams"))

    def test_non_member_without_grant_is_denied(self) -> None:
        user = baker.make(User)
        self.assertFalse(self.org_2.users.filter(pk=user.pk).exists())

        response = self._list_org_2(user)
        self.assertIsNotNone(response.get("errors"))
        self.assertIsNone((response.get("data") or {}).get("teams"))

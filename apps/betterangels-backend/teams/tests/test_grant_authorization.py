"""Teams write authority — grant-only (ADR 0001 §5.3, provisioning).

§5.3 provisioning role-backed ``ORG_ADMIN``/``ORG_SUPERUSER`` and removed the
transitional legacy arm: ``OrgRoleManager(org).add_roles(user, ORG_ADMIN)`` now
writes a scoped ``Grant`` (role = "Organization Admin"), and ``reconcile``
retired the template's legacy ``PermissionGroup`` rows.  These tests pin the
grant-only contract:

- an org admin (ORG_ADMIN Grant) manages teams with no legacy group;
- a holder of a stale legacy ``ORG_ADMIN`` ``PermissionGroup`` with no Grant
  fails closed;
- a member with neither is denied;
- a Grant at org A does not authorize acting at org B;
- update/delete thread CHANGE/DELETE (a holder of ADD alone cannot update/delete).
"""

from accounts.groups import ORG_ADMIN
from accounts.models import PermissionGroup, PermissionGroupTemplate, User
from model_bakery import baker
from teams.models import Team

from .utils import TeamGraphQLBaseTestCase, TeamGraphQLUtilsMixin

PERMISSION_DENIED = "You do not have permission to perform this action in this organization."


class TeamLegacyAuthorityTestCase(TeamGraphQLBaseTestCase):
    """§5.3 provisioning: an org admin is a Grant holder; legacy-only fails closed."""

    def test_org_admin_can_create_a_team(self) -> None:
        # org_1_admin holds ORG_ADMIN as a scoped Grant (role-backed template).
        self.assertTrue(self.org_1_admin.grants.filter(scope_org=self.org_1).exists())

        response = self.create_team_fixture({"name": "grant-era team"})

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createTeam"]["name"], "grant-era team")

    def test_legacy_group_only_org_admin_is_denied(self) -> None:
        """A stale ORG_ADMIN PermissionGroup holder with no Grant fails closed."""
        legacy_user = baker.make(User)
        self.org_1.add_user(legacy_user)
        # Simulate a pre-backfill org: a legacy ORG_ADMIN group row that the
        # grant-only seam must not read.
        template = PermissionGroupTemplate.objects.get(name=ORG_ADMIN.name)
        PermissionGroup.objects.create(organization=self.org_1, template=template)
        legacy_group = PermissionGroup.objects.get(organization=self.org_1, template=template)
        legacy_user.groups.add(legacy_group)
        self.assertFalse(legacy_user.grants.filter(scope_org=self.org_1).exists())

        self.graphql_client.force_login(legacy_user)
        self._set_active_org(self.org_1)

        response = self.create_team_fixture({"name": "legacy-only team"})

        self.assertEqual(response["errors"][0]["message"], PERMISSION_DENIED)
        self.assertFalse(Team.objects.filter(name="legacy-only team").exists())

    def test_org_admin_can_update_and_delete_a_team(self) -> None:
        team = baker.make(Team, name="old name", organization=self.org_1)

        response = self.update_team_fixture({"id": team.pk, "name": "new name"})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["updateTeam"]["name"], "new name")

        response = self.delete_team_fixture(team.pk)
        self.assertIsNone(response.get("errors"))
        self.assertFalse(Team.objects.filter(pk=team.pk).exists())


class TeamGrantAuthorityTestCase(TeamGraphQLUtilsMixin):
    """The grant arm: a scoped-Grant holder manages teams with no legacy group."""

    def setUp(self) -> None:
        super().setUp()
        self.grant_user = baker.make(User)
        self.org_1.add_user(self.grant_user)
        # A scoped test Role carrying the team perms (no legacy PermissionGroup).
        for perm in (Team.perms.ADD, Team.perms.CHANGE, Team.perms.DELETE):
            self._grant_permission(self.grant_user, str(perm), self.org_1, role_name="Team Admin")

        self.graphql_client.force_login(self.grant_user)
        self._set_active_org(self.org_1)

    def test_grant_holder_can_create_a_team(self) -> None:
        response = self.create_team_fixture({"name": "grant-created team"})

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createTeam"]["name"], "grant-created team")

    def test_grant_holder_can_update_and_delete_a_team(self) -> None:
        team = baker.make(Team, name="old name", organization=self.org_1)

        response = self.update_team_fixture({"id": team.pk, "name": "renamed"})
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["updateTeam"]["name"], "renamed")

        response = self.delete_team_fixture(team.pk)
        self.assertIsNone(response.get("errors"))
        self.assertFalse(Team.objects.filter(pk=team.pk).exists())

    def test_grant_holder_with_only_add_cannot_update_or_delete(self) -> None:
        """Mutations thread the exact permission: CHANGE/DELETE, not just ADD."""
        add_only = baker.make(User)
        self.org_1.add_user(add_only)
        self._grant_permission(add_only, str(Team.perms.ADD), self.org_1, role_name="Team Creator")

        team = baker.make(Team, name="name", organization=self.org_1)

        self.graphql_client.force_login(add_only)
        self._set_active_org(self.org_1)

        create_response = self.create_team_fixture({"name": "created"})
        self.assertIsNone(create_response.get("errors"))

        update_response = self.update_team_fixture({"id": team.pk, "name": "nope"})
        self.assertEqual(update_response["errors"][0]["message"], PERMISSION_DENIED)

        delete_response = self.delete_team_fixture(team.pk)
        self.assertEqual(delete_response["errors"][0]["message"], PERMISSION_DENIED)

    def test_member_with_no_authority_is_denied(self) -> None:
        member = baker.make(User)
        self.org_1.add_user(member)

        self.graphql_client.force_login(member)
        self._set_active_org(self.org_1)

        initial_count = Team.objects.count()
        response = self.create_team_fixture({"name": "should not appear"})

        self.assertEqual(response["errors"][0]["message"], PERMISSION_DENIED)
        self.assertEqual(Team.objects.count(), initial_count)

    def test_grant_at_org_a_does_not_authorize_org_b(self) -> None:
        # grant_user holds the team perms at org_1 only; acting at org_2 must fail.
        self._set_active_org(self.org_2)

        response = self.create_team_fixture({"name": "wrong org"})

        self.assertEqual(response["errors"][0]["message"], PERMISSION_DENIED)

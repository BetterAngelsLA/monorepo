"""Teams write authority — grant arm OR legacy (ADR 0001 §5.3, teams slice).

The three team mutations are authorized by the grant predicate (``can()``) or,
during the transition while ``ORG_ADMIN`` / ``ORG_SUPERUSER`` are still legacy
templates, by the legacy org-scoped check (``HasOrgPerm``'s
``permissioned_queryset``).  These tests pin **both** arms so the transition
cannot silently drop either authority:

- a legacy ``ORG_ADMIN`` holder with no Grant still passes (current behavior);
- a scoped-Grant holder with no legacy group passes via the grant arm;
- a member with neither is denied;
- a Grant at org A does not authorize acting at org B;
- update/delete thread CHANGE/DELETE (a holder of ADD alone cannot update/delete).

The dual-read is transitional: the legacy arm is removed when the §5.3
provisioning PR role-backs the template and backfills Grants.
"""

from accounts.models import User
from model_bakery import baker
from teams.models import Team

from .utils import TeamGraphQLBaseTestCase, TeamGraphQLUtilsMixin

PERMISSION_DENIED = "You do not have permission to perform this action in this organization."


class TeamLegacyAuthorityTestCase(TeamGraphQLBaseTestCase):
    """The legacy ORG_ADMIN holder keeps working — no Grant needed (transitional arm)."""

    def test_legacy_org_admin_can_create_a_team(self) -> None:
        # org_1_admin holds ORG_ADMIN as a legacy PermissionGroup, no Grant.
        self.assertFalse(self.org_1_admin.grants.filter(scope_org=self.org_1).exists())

        response = self.create_team_fixture({"name": "grant-era team"})

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createTeam"]["name"], "grant-era team")

    def test_legacy_org_admin_can_update_and_delete_a_team(self) -> None:
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

"""Registry canary — every teams Query/Mutation field is protected (ADR 0001 §5.3).

The teams cutover made authorization behavioral: each resolver authorizes
through ``require_can`` (``_org_or_deny`` at the payload org for creates, the
row's org for update/delete) and no transport permission extension guards the
fields, so a future author could add an unguarded field and nothing would
statically complain.

These tests close that gap the same way the shelter cutover did (finding F8 on
#2443): every field on the teams ``Query`` / ``Mutation`` types must appear
below with its authorization route — adding a field means consciously
registering it here — and ``TeamsAuthzEnforcementTestCase`` calls every field
without a Grant and expects a denial.

The grant matrix lives in ``test_grant_authorization.py``; the field → test map:

    teams        test_member_without_grant_is_denied / test_non_member_without_grant_is_denied
    create_team  test_member_with_no_authority_is_denied / test_grant_at_org_a_does_not_authorize_org_b
    update_team  test_grant_holder_with_only_add_cannot_update_or_delete
    delete_team  test_grant_holder_with_only_add_cannot_update_or_delete
"""

from typing import Any

from model_bakery import baker

from accounts.models import User
from common.permissions.utils import PERMISSION_DENIED_MESSAGE
from teams.models import Team
from teams.schema import Mutation, Query

from .utils import TeamGraphQLUtilsMixin

# field -> where authorization happens for that read.
QUERY_AUTHZ_ROUTES: dict[str, str] = {
    "teams": "resolver -> _org_or_deny(organizationId) + require_can(VIEW, org)",
}

# mutation -> where authorization happens for that write.
MUTATION_AUTHZ_ROUTES: dict[str, str] = {
    "create_team": "resolver -> _org_or_deny(organizationId) + require_can(ADD, org)",
    "update_team": "resolver -> team_get + require_can(CHANGE, row org)",
    "delete_team": "resolver -> team_get + require_can(DELETE, row org)",
}


def _field_names(cls: Any) -> set[str]:
    return {f.python_name for f in cls.__strawberry_definition__.fields}


def test_every_teams_query_field_is_registered() -> None:
    actual = _field_names(Query)
    assert actual == set(QUERY_AUTHZ_ROUTES), (
        "Teams Query field(s) are not registered with an authorization route: "
        f"{sorted(actual ^ set(QUERY_AUTHZ_ROUTES))}"
    )


def test_every_teams_mutation_field_is_registered() -> None:
    actual = _field_names(Mutation)
    assert actual == set(MUTATION_AUTHZ_ROUTES), (
        "Teams Mutation field(s) are not registered with an authorization route: "
        f"{sorted(actual ^ set(MUTATION_AUTHZ_ROUTES))}"
    )


def test_every_registered_route_names_a_gate() -> None:
    """Read the route strings: a placeholder registration must not pass."""
    for field, route in {**QUERY_AUTHZ_ROUTES, **MUTATION_AUTHZ_ROUTES}.items():
        assert "require_can" in route, f"{field} route does not name require_can: {route}"


class TeamsAuthzEnforcementTestCase(TeamGraphQLUtilsMixin):
    """Every registered field refuses a member who holds no Grant."""

    def setUp(self) -> None:
        super().setUp()
        self.member = baker.make(User)
        self.org_1.add_user(self.member)
        self.graphql_client.force_login(self.member)

    def test_every_field_denies_without_a_grant(self) -> None:
        org_id = self.org_1.pk
        team = baker.make(Team, organization=self.org_1)

        teams = self.execute_graphql(self.get_teams_query(), {"filters": {"organizationId": str(org_id)}})
        self.assertIsNotNone(teams.get("errors"))
        self.assertIsNone((teams.get("data") or {}).get("teams"))

        self.assertGraphQLOperationInfo(
            self.create_team_fixture({"name": "denied", "organizationId": org_id}),
            "createTeam",
            PERMISSION_DENIED_MESSAGE,
            kind="PERMISSION",
        )
        self.assertGraphQLOperationInfo(
            self.update_team_fixture({"id": team.pk, "name": "denied"}),
            "updateTeam",
            PERMISSION_DENIED_MESSAGE,
            kind="PERMISSION",
        )
        self.assertGraphQLOperationInfo(
            self.delete_team_fixture(team.pk),
            "deleteTeam",
            PERMISSION_DENIED_MESSAGE,
            kind="PERMISSION",
        )

"""Registry canary — every teams Query/Mutation field is protected (ADR 0001 §5.3).

The teams cutover made authorization behavioral: each resolver authorizes
through ``require_can`` (``_org_or_deny`` at the payload org for creates, the
row's org for update/delete) and no transport permission extension guards the
fields, so a future author could add an unguarded field and nothing would
statically complain.

These tests close that gap the same way the shelter cutover did (finding F8 on
#2443): every field on the teams ``Query`` / ``Mutation`` types must appear
below with its authorization route — adding a field means consciously
registering it here.

The registry documents the route; ``test_grant_authorization.py`` and the
mutation suites prove the route actually enforces the permission.
"""

from typing import Any

from teams.schema import Mutation, Query

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

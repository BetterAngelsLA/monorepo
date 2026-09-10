"""Registry canary — every tasks Query/Mutation field is protected (ADR 0001 §5, RFC 0003).

The tasks cutover made authorization behavioral: the single read rides the
shared grant checker (``HasPerm`` + ``can_anywhere_checker``), the list rides
the type-level ``get_queryset`` hook (``visible_rows_for_holder``), and the
mutations authorize through ``resolve_org_or_deny`` + ``require_can`` /
``can_obj`` — none of them inherits a transport default that would let an
unguarded field through.

These tests close the same gap the teams cutover did (finding F8 on #2443):
every field on the tasks ``Query`` / ``Mutation`` types must appear below with
its authorization route — adding a field means consciously registering it
here.

The registry documents the route; ``test_grant_authorization.py`` and the
mutation suites prove the route actually enforces the permission.
"""

from typing import Any

from tasks.schema import Mutation, Query

# field -> where authorization happens for that read.
QUERY_AUTHZ_ROUTES: dict[str, str] = {
    "task": "extension -> HasPerm(VIEW) + can_anywhere_checker (grant)",
    "tasks": "resolver -> tasks_for_user + TaskType.get_queryset -> visible_rows_for_holder(VIEW)",
}

# mutation -> where authorization happens for that write.
MUTATION_AUTHZ_ROUTES: dict[str, str] = {
    "create_task": "resolver -> resolve_org_or_deny(organizationId) + require_can(ADD, org)",
    "update_task": "resolver -> get_or_none + can_obj(CHANGE, row)",
    "delete_task": "resolver -> get_or_none + can_obj(DELETE, row)",
}


def _field_names(cls: Any) -> set[str]:
    return {f.python_name for f in cls.__strawberry_definition__.fields}


def test_every_tasks_query_field_is_registered() -> None:
    actual = _field_names(Query)
    assert actual == set(QUERY_AUTHZ_ROUTES), (
        "Tasks Query field(s) are not registered with an authorization route: "
        f"{sorted(actual ^ set(QUERY_AUTHZ_ROUTES))}"
    )


def test_every_tasks_mutation_field_is_registered() -> None:
    actual = _field_names(Mutation)
    assert actual == set(MUTATION_AUTHZ_ROUTES), (
        "Tasks Mutation field(s) are not registered with an authorization route: "
        f"{sorted(actual ^ set(MUTATION_AUTHZ_ROUTES))}"
    )

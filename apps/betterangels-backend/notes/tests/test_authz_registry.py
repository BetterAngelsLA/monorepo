"""Registry canary — every notes Query/Mutation field is protected (ADR 0001 §5, RFC 0003 slice 2).

The notes cutover made authorization behavioral: the single read rides the
shared grant checker (``HasPerm`` + ``can_anywhere_checker``), the list rides
the type-level ``get_queryset`` hook (``visible_rows_for_holder``), and the
mutations authorize through ``resolve_org_or_deny`` + ``require_can`` /
``get_writable_or_deny`` (the write-scoped fetch is the gate) — none of them
inherits a transport default that would let an unguarded field through.

These tests close the same gap the teams/shelters/tasks cutovers did: every
field on the notes ``Query`` / ``Mutation`` types must appear below with its
authorization route — adding a field means consciously registering it here.

The registry documents the route; ``test_grant_authorization.py`` and the
mutation suites prove the route actually enforces the permission.
"""

from typing import Any

from notes.schema import Mutation, Query

# field -> where authorization happens for that read.
QUERY_AUTHZ_ROUTES: dict[str, str] = {
    "note": "field -> HasPerm(VIEW) + can_anywhere_checker (SHARED read)",
    "notes": "resolver -> NoteType.get_queryset -> visible_rows_for_holder(VIEW)",
    "services": "field -> HasPerm(Note ADD) + can_anywhere_checker",
    "service_categories": "field -> HasPerm(Note ADD) + can_anywhere_checker",
    "interaction_authors": "field -> HasPerm(Note ADD) + can_anywhere_checker",
    "caseworker_organizations": (
        "resolver -> legacy PermissionGroup membership (pre-cutover read, retires with the legacy groups)"
    ),
}

# mutation -> where authorization happens for that write.
MUTATION_AUTHZ_ROUTES: dict[str, str] = {
    "create_note": (
        "resolver -> resolve_org_or_deny(organizationId) + require_can(ADD, org); "
        "legacy-group fallback while pre-payload builds exist"
    ),
    "update_note": "resolver -> get_writable_or_deny(CHANGE, row)",
    "update_note_location": "resolver -> get_writable_or_deny(CHANGE, row)",
    "revert_note": "resolver -> get_writable_or_deny(CHANGE, row)",
    "delete_note": "resolver -> get_writable_or_deny(DELETE, row)",
    "create_note_service_request": "resolver -> get_writable_or_deny(CHANGE, owning note)",
    "delete_service_request": (
        "resolver -> get_or_none(SR) + writable(Note CHANGE).filter(provided/requested).exists() "
        "(owning note's org; detached SRs fail closed)"
    ),
    "create_note_data_import": (
        "extension -> HasPerm(NoteImportRecord ADD) (import surface; GATE_EXEMPT until a role carries import perms)"
    ),
    "import_note": (
        "extension -> HasPerm(NoteImportRecord ADD) (import surface; GATE_EXEMPT until a role carries import perms)"
    ),
    "generate_note_file_uploads": ("resolver -> get_writable_or_deny(Note CHANGE) — attachments ride the note gate"),
    "resolve_note_file_uploads": ("resolver -> get_writable_or_deny(Note CHANGE) — attachments ride the note gate"),
}


def _field_names(cls: Any) -> set[str]:
    return {f.python_name for f in cls.__strawberry_definition__.fields}


def test_every_notes_query_field_is_registered() -> None:
    actual = _field_names(Query)
    assert actual == set(QUERY_AUTHZ_ROUTES), (
        f"Notes Query field(s) are not registered with an authorization route: {sorted(actual ^ set(QUERY_AUTHZ_ROUTES))}"
    )


def test_every_notes_mutation_field_is_registered() -> None:
    actual = _field_names(Mutation)
    assert actual == set(MUTATION_AUTHZ_ROUTES), (
        "Notes Mutation field(s) are not registered with an authorization route: "
        f"{sorted(actual ^ set(MUTATION_AUTHZ_ROUTES))}"
    )

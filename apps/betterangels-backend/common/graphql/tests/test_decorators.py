"""Tests for GraphQL decorators."""

from typing import Any

import strawberry
from common.graphql.decorators import (
    apply_schema_directives_and_permissions_to_all_fields,
)
from strawberry.permission import BasePermission
from strawberry.schema_directive import Location as DirectiveLocation
from strawberry.schema_directive import schema_directive


# Test directive
@schema_directive(locations=[DirectiveLocation.FIELD_DEFINITION])
class TestDirective:
    """Test directive for testing apply_schema_directives_and_permissions_to_all_fields"""

    pass


# Test permission class
class TestPermission(BasePermission):
    message: str = "Test permission denied"

    def has_permission(self, source: Any, info: Any, **kwargs: Any) -> bool:
        return True


def test_apply_schema_directives_and_permissions_with_directive() -> None:
    """Test that directives are applied to all fields"""

    @apply_schema_directives_and_permissions_to_all_fields(directives=[TestDirective])
    @strawberry.type
    class Query:
        @strawberry.field
        def field1(self) -> str:
            return "test1"

        @strawberry.field
        def field2(self) -> str:
            return "test2"

    # Check that both fields have the directive
    fields = Query.__strawberry_definition__.fields  # type: ignore[attr-defined]
    assert len(fields) == 2
    for field in fields:
        assert field.directives is not None
        assert any(isinstance(d, TestDirective) for d in field.directives)


def test_apply_schema_directives_and_permissions_with_exclusion() -> None:
    """Test that excluded fields don't get the directive"""

    @apply_schema_directives_and_permissions_to_all_fields(
        directives=[TestDirective], exclude_fields=["excluded_field"]
    )
    @strawberry.type
    class Query:
        @strawberry.field
        def normal_field(self) -> str:
            return "normal"

        @strawberry.field
        def excluded_field(self) -> str:
            return "excluded"

    fields_by_name = {f.name: f for f in Query.__strawberry_definition__.fields}  # type: ignore[attr-defined]

    # normal_field should have the directive
    assert any(isinstance(d, TestDirective) for d in (fields_by_name["normal_field"].directives or []))

    # excluded_field should NOT have the directive
    assert not any(isinstance(d, TestDirective) for d in (fields_by_name["excluded_field"].directives or []))


def test_apply_schema_directives_and_permissions_no_duplicate_directives() -> None:
    """Test that directives are not duplicated if already present"""

    @apply_schema_directives_and_permissions_to_all_fields(directives=[TestDirective])
    @strawberry.type
    class Query:
        @strawberry.field
        def field1(self) -> str:
            return "test1"

    # Apply the decorator again (simulating multiple applications)
    Query_2 = apply_schema_directives_and_permissions_to_all_fields(directives=[TestDirective])(Query)

    # Check that directive was applied only once
    field = Query_2.__strawberry_definition__.fields[0]  # type: ignore[attr-defined]
    directive_count = sum(1 for d in (field.directives or []) if isinstance(d, TestDirective))
    assert directive_count == 1
    directive_count = sum(1 for d in (field.directives or []) if isinstance(d, TestDirective))
    assert directive_count == 1

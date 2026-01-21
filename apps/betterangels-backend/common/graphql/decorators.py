"""Shared decorators for GraphQL types and mutations."""

from typing import Any, Type, TypeVar

from strawberry.permission import BasePermission

T = TypeVar("T")


def apply_schema_directives_and_permissions_to_all_fields(
    directives: list[Type[Any]] | None = None,
    permission_classes: list[Type[BasePermission]] | None = None,
    exclude_fields: list[str] | None = None,
) -> Any:
    """
    Decorator that applies directives and/or permission classes to all fields in a Query or Mutation class.

    This decorator automatically applies specified directives and permission classes to all fields,
    making it easier to enforce consistent behavior across GraphQL operations.

    Args:
        directives: Optional list of directive classes to apply to all fields
        permission_classes: Optional list of permission classes to apply to all fields
        exclude_fields: Optional list of field names to exclude from modifications

    Example:
        @apply_schema_directives_and_permissions_to_all_fields(
            directives=[MyDirective],
            permission_classes=[MyPermission],
            exclude_fields=['myField']
        )
        @strawberry.type
        class Query:
            def excluded_field(self) -> str:
                # This field won't get directives or permissions applied
                ...
    """

    def decorator(cls: T) -> T:
        exclude_set = set(exclude_fields or [])

        if hasattr(cls, "__strawberry_definition__"):
            for field in cls.__strawberry_definition__.fields:
                # Skip excluded fields
                if field.name in exclude_set:
                    continue

                # Apply directives if specified
                if directives:
                    for directive_class in directives:
                        if not field.directives or directive_class not in [type(d) for d in field.directives]:
                            field.directives = list(field.directives or []) + [directive_class()]

                # Apply permission classes if specified
                if permission_classes:
                    field.permission_classes = list(field.permission_classes or []) + permission_classes

        return cls

    return decorator

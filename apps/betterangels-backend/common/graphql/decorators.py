"""Shared decorators for GraphQL types and mutations."""

from typing import Any, Type, TypeVar

from strawberry.permission import BasePermission

T = TypeVar("T")


def apply_schema_directives_and_permissions_to_all_fields(
    directives: list[Type[Any]] | None = None,
    permission_classes: list[Type[BasePermission]] | None = None,
    exclude_fields: list[str] | None = None,
    exclude_permissions: list[str] | None = None,
) -> Any:
    """
    Decorator that applies directives and/or permission classes to all fields in a Query or Mutation class.

    This decorator automatically applies specified directives and permission classes to all fields,
    making it easier to enforce consistent behavior across GraphQL operations.

    Args:
        directives: Optional list of directive classes to apply to all fields
        permission_classes: Optional list of permission classes to apply to all fields
        exclude_fields: Optional list of field names to exclude from all modifications (directives and permissions)
        exclude_permissions: Optional list of field names to exclude from permission classes only

    Example:
        @apply_schema_directives_and_permissions_to_all_fields(
            directives=[HmisDirective],
            permission_classes=[IsHmisAuthenticated],
            exclude_permissions=['hmis_login']
        )
        @strawberry.type
        class Mutation:
            def hmis_login(self) -> str:
                # This field gets the directive but NOT the permission
                ...
    """

    def decorator(cls: T) -> T:
        exclude_set = set(exclude_fields or [])
        exclude_perms_set = set(exclude_permissions or [])

        if hasattr(cls, "__strawberry_definition__"):
            for field in cls.__strawberry_definition__.fields:
                # Skip fields excluded from all modifications
                if field.name in exclude_set:
                    continue

                # Apply directives if specified
                if directives:
                    for directive_class in directives:
                        if not field.directives or directive_class not in [type(d) for d in field.directives]:
                            field.directives = list(field.directives or []) + [directive_class()]

                # Apply permission classes if specified (skip if in exclude_permissions)
                if permission_classes and field.name not in exclude_perms_set:
                    field.permission_classes = list(field.permission_classes or []) + permission_classes

        return cls

    return decorator

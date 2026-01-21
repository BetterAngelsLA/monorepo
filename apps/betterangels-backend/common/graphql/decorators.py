"""Shared decorators for GraphQL types and mutations."""

from typing import Any, Type, TypeVar

from strawberry.permission import BasePermission, PermissionExtension

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

    Technical Implementation:
        - Directives: Appended to field.directives list
        - Permissions: Added to field.extensions as PermissionExtension (Strawberry's native mechanism)
        - Works with all field types: @strawberry.field, @strawberry_django.field,
          and strawberry_django.offset_paginated() descriptors

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

        # Apply modifications after strawberry.type has processed the class
        if hasattr(cls, "__strawberry_definition__"):
            for field in cls.__strawberry_definition__.fields:
                if field.name in exclude_set:
                    continue

                # Apply directives
                if directives:
                    existing_directive_types = {type(d) for d in (field.directives or [])}
                    new_directives = [d() for d in directives if d not in existing_directive_types]
                    if new_directives:
                        field.directives = list(field.directives or []) + new_directives

                # Apply permissions
                if permission_classes and field.name not in exclude_perms_set:
                    # Find and merge with existing PermissionExtension
                    existing_perm_ext = next(
                        (ext for ext in (field.extensions or []) if isinstance(ext, PermissionExtension)), None
                    )
                    other_extensions = [
                        ext for ext in (field.extensions or []) if not isinstance(ext, PermissionExtension)
                    ]

                    existing_perms = existing_perm_ext.permissions if existing_perm_ext else []
                    new_perms = [perm() for perm in permission_classes]
                    field.extensions = other_extensions + [PermissionExtension(existing_perms + new_perms)]

        return cls

    return decorator

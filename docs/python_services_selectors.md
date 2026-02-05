# Python Services & Selectors Pattern

This document describes our best practices for organizing Django business logic using the **Services** and **Selectors** pattern, inspired by [HackSoft's Django Styleguide](https://github.com/HackSoftware/Django-Styleguide).

## Overview

We separate concerns into distinct layers:

| Layer         | Purpose                        | Location            | Example                       |
| ------------- | ------------------------------ | ------------------- | ----------------------------- |
| **Selectors** | Data fetching & queries        | `app/selectors.py`  | `get_organization_member()`   |
| **Services**  | Business logic & mutations     | `app/services/*.py` | `member_add()`                |
| **Schema**    | GraphQL resolvers (thin layer) | `app/schema.py`     | Composes selectors + services |

## Selectors

Selectors are functions that **fetch data**. They encapsulate query logic and can include permission filtering.

### Location

- Single file: `app/selectors.py`
- For larger apps: `app/selectors/` directory with modules

### Naming Conventions

```python
# Single object retrieval
def get_<entity>(*, ...) -> Model | None:
    """Get a single entity, returns None if not found."""

# Multiple objects retrieval
def get_<entities>(*, ...) -> QuerySet[Model]:
    """Get a queryset of entities."""

# Filtered retrieval with context
def get_user_<entity>(info, ...) -> Model:
    """Get entity scoped to current user's permissions."""
```

### Best Practices

```python
"""Selectors for accounts app - data fetching with permission checks."""

from django.db.models import QuerySet
from organizations.models import Organization

from .models import User


def get_organization_member(
    *,
    organization: Organization,
    user_id: int,
) -> User | None:
    """
    Get a user from an organization with their role annotated.

    Args:
        organization: The organization to get the member from.
        user_id: The ID of the user to retrieve.

    Returns:
        User with _member_role annotation, or None if not found.
    """
    return (
        organization.users.filter(id=user_id)
        .annotate(_member_role=_annotate_member_role(organization.id))
        .first()
    )


def get_organization_members(
    *,
    organization: Organization,
) -> QuerySet[User]:
    """
    Get all users from an organization with their roles annotated.

    Args:
        organization: The organization to get members from.

    Returns:
        QuerySet of Users with _member_role annotation.
    """
    return organization.users.annotate(
        _member_role=_annotate_member_role(organization.id)
    )
```

**Key principles:**

1. **Keyword-only arguments** (`*`) - Forces explicit parameter names at call sites
2. **Type hints** - Always include return types and parameter types
3. **Docstrings** - Document Args, Returns, and Raises
4. **No side effects** - Selectors only read data, never modify
5. **Private helpers** - Prefix with `_` for internal functions (e.g., `_annotate_member_role`)

### Permission-Aware Selectors

For GraphQL resolvers using `PermissionedQuerySet`, create selectors that leverage `info.context.qs`:

```python
from django.core.exceptions import PermissionDenied
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user


def get_user_organization(
    info: Info,
    organization_id: str,
    *,
    permission_denied_message: str,
) -> Organization:
    """
    Get an organization the current user belongs to and has permission for.

    Uses the permission-filtered queryset from PermissionedQuerySet extension.
    """
    current_user = get_current_user(info)
    try:
        return info.context.qs.filter(users=current_user).get(id=organization_id)
    except Organization.DoesNotExist:
        raise PermissionDenied(permission_denied_message)
```

## Services

Services are functions that **perform actions** (create, update, delete) and contain business logic.

### Location

- `app/services/` directory with domain-specific modules
- Example: `accounts/services/users.py` for user-related operations

### Naming Conventions

```python
# Entity operations
def <entity>_create(*, ...) -> Model:
def <entity>_update(*, ...) -> Model:
def <entity>_delete(*, ...) -> int:

# Relationship operations
def member_add(*, ...) -> User:
def member_remove(*, ...) -> int:
def member_change_role(*, ...) -> User:
```

### Best Practices

```python
"""Service for organization member operations."""

from django.core.exceptions import ValidationError
from django.db import transaction

from accounts.models import User
from organizations.models import Organization


def member_add(
    *,
    organization: Organization,
    email: str,
    first_name: str,
    last_name: str,
    middle_name: str | None = None,
    current_user: User,
) -> User:
    """
    Add a new member to an organization and send invitation.

    Args:
        organization: The organization to add the member to.
        email: Email address of the new member.
        first_name: First name of the new member.
        last_name: Last name of the new member.
        middle_name: Middle name of the new member.
        current_user: The user performing the action.

    Returns:
        The created or existing User object.

    Raises:
        ValidationError: If the user is already a member.
    """
    with transaction.atomic():
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": str(uuid.uuid4()), "is_active": True},
        )
        # ... business logic
    return user


def member_remove(
    *,
    organization: Organization,
    user_id: int,
    current_user: User,
) -> int:
    """
    Remove a member from an organization.

    Raises:
        ValidationError: If user is not a member, is the owner,
            or is removing themselves.
    """
    # Validate business rules
    if user_id == current_user.pk:
        raise ValidationError("You cannot remove yourself from the organization.")

    # ... perform deletion
    return user_id
```

**Key principles:**

1. **Keyword-only arguments** (`*`) - Explicit parameter names
2. **Explicit inputs** - Pass models, not IDs, when the caller already has them
3. **Transaction handling** - Use `transaction.atomic()` for multi-step operations
4. **Business rule validation** - Raise `ValidationError` for domain rule violations
5. **Return meaningful values** - Return the created/updated object or deleted ID

### What Services Should NOT Do

- ❌ Access `request` or GraphQL `info` directly
- ❌ Handle HTTP/GraphQL-specific concerns
- ❌ Check permissions (that's the resolver's job)
- ❌ Format responses for API consumption

## Schema (GraphQL Resolvers)

Resolvers should be **thin** - they compose selectors and services.

### Pattern

```python
from accounts import services
from accounts.selectors import get_organization_member, get_user_organization


@strawberry.type
class Mutation:
    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[
            PermissionedQuerySet(
                UserOrganizationPermissions.ADD_ORG_MEMBER,
                model=Organization,
                check_retval=False,
            )
        ],
    )
    def add_organization_member(
        self, info: Info, data: OrgInvitationInput
    ) -> OrganizationMemberType:
        # 1. Get current user
        current_user = cast(User, get_current_user(info))

        # 2. Use selector to get permission-scoped organization
        organization = get_user_organization(
            info,
            data.organization_id,
            permission_denied_message="You do not have permission to add members.",
        )

        # 3. Call service for business logic
        user = services.member_add(
            organization=organization,
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
            current_user=current_user,
        )

        return cast(OrganizationMemberType, user)
```

### Resolver Responsibilities

| ✅ Do                             | ❌ Don't                     |
| --------------------------------- | ---------------------------- |
| Extract current user from context | Implement business logic     |
| Call selectors for data fetching  | Write complex queries        |
| Call services for mutations       | Handle database transactions |
| Cast return types                 | Validate business rules      |
| Handle permission extensions      | Access ORM directly          |

## File Structure

```
app/
├── __init__.py
├── models.py          # Django models
├── selectors.py       # Data fetching functions
├── services/          # Business logic
│   ├── __init__.py
│   └── users.py       # Domain-specific services
├── schema.py          # GraphQL resolvers
├── types.py           # GraphQL types
└── tests/
    ├── test_permissions.py
    └── test_queries.py
```

## Testing

### Test Services Directly

```python
class MemberAddServiceTest(TestCase):
    def test_member_add_creates_user(self):
        org = baker.make(Organization)
        admin = baker.make(User)

        user = services.member_add(
            organization=org,
            email="new@example.com",
            first_name="New",
            last_name="User",
            current_user=admin,
        )

        self.assertEqual(user.email, "new@example.com")
        self.assertTrue(org.users.filter(id=user.id).exists())

    def test_member_add_raises_for_existing_member(self):
        org = baker.make(Organization)
        existing = baker.make(User, email="existing@example.com")
        org.add_user(existing)

        with self.assertRaises(ValidationError):
            services.member_add(
                organization=org,
                email="existing@example.com",
                first_name="Existing",
                last_name="User",
                current_user=baker.make(User),
            )
```

### Test Selectors Independently

```python
class GetOrganizationMemberSelectorTest(TestCase):
    def test_returns_user_with_role_annotation(self):
        org = baker.make(Organization)
        user = baker.make(User)
        org.add_user(user)

        result = get_organization_member(organization=org, user_id=user.id)

        self.assertEqual(result.id, user.id)
        self.assertTrue(hasattr(result, "_member_role"))
```

## Summary

| Aspect       | Selectors                | Services                       |
| ------------ | ------------------------ | ------------------------------ |
| Purpose      | Read data                | Write/mutate data              |
| Side effects | None                     | Yes (DB changes, emails, etc.) |
| Returns      | Model, QuerySet, or None | Model or ID                    |
| Raises       | `PermissionDenied`       | `ValidationError`              |
| Location     | `selectors.py`           | `services/*.py`                |

This pattern keeps resolvers thin, makes business logic testable, and provides clear separation of concerns.

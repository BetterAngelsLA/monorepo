"""Selectors for accounts app - data fetching with permission checks."""

from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from django.core.exceptions import PermissionDenied
from django.db.models import Case, CharField, Exists, OuterRef, QuerySet, Value, When
from organizations.models import Organization
from strawberry import ID
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user


def get_user_organization(
    info: Info,
    organization_id: str | ID,
    *,
    permission_denied_message: str,
) -> Organization:
    """
    Get an organization that the current user belongs to and has permission for.

    Uses the permission-filtered queryset from PermissionedQuerySet extension,
    further filtered to organizations the user is a member of.

    Args:
        info: GraphQL info context (must have qs set by PermissionedQuerySet).
        organization_id: The ID of the organization to retrieve.
        permission_denied_message: Error message if user lacks access.

    Returns:
        The Organization object.

    Raises:
        PermissionDenied: If user doesn't belong to or have permission for the org.
    """
    current_user = get_current_user(info)
    try:
        return info.context.qs.filter(users=current_user).get(id=organization_id)
    except Organization.DoesNotExist:
        raise PermissionDenied(permission_denied_message)


def _annotate_member_role(org_id: int | str) -> Case:
    """Build a Case expression to annotate a user's role in an organization."""
    is_superuser = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=GroupTemplateNames.ORG_SUPERUSER,
            group__user=OuterRef("pk"),
        )
    )
    is_admin = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=GroupTemplateNames.ORG_ADMIN,
            group__user=OuterRef("pk"),
        )
    )

    return Case(
        When(is_superuser, then=Value(OrgRoleEnum.SUPERUSER)),
        When(is_admin, then=Value(OrgRoleEnum.ADMIN)),
        default=Value(OrgRoleEnum.MEMBER),
        output_field=CharField(),
    )


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
    user: User | None = (
        organization.users.filter(id=user_id).annotate(_member_role=_annotate_member_role(organization.id)).first()
    )
    return user


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
    qs: QuerySet[User] = organization.users.annotate(_member_role=_annotate_member_role(organization.id))
    return qs

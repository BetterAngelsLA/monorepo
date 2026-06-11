"""Read-only queries for organization permissions — per the Django Styleguide.

Reference: https://github.com/HackSoftware/Django-Styleguide#selectors
"""

from django.core.exceptions import ValidationError
from organizations.models import Organization

from .models import PermissionGroup, User


def permission_group_for_user(user: User, org_id: str, template_name: str) -> PermissionGroup:
    """Return the ``PermissionGroup`` matching *template_name* for *user* in org *org_id*.

    Validates that the organization exists, the user is a member, and a
    ``PermissionGroup`` with the given template name is present.

    Raises :class:`~django.core.exceptions.ValidationError` on any of
    these conditions.
    """
    # Single query to find the PermissionGroup with org + user membership + template
    # all validated at once. Falls back to disambiguation queries only on failure.
    try:
        return PermissionGroup.objects.select_related("organization").get(
            organization_id=org_id,
            organization__users=user,
            template__name=template_name,
        )
    except PermissionGroup.DoesNotExist:
        # Disambiguate which condition failed.
        if not Organization.objects.filter(pk=org_id).exists():
            raise ValidationError(f"Organization with id '{org_id}' not found.")
        if not Organization.objects.filter(pk=org_id, users=user).exists():
            raise ValidationError(f"User '{user}' is not a member of organization with id '{org_id}'.")
        raise ValidationError(
            f"Permission group for template '{template_name}' not found in organization with id '{org_id}'."
        )

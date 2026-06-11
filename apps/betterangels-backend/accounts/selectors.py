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
    try:
        org = Organization.objects.get(pk=org_id)
    except Organization.DoesNotExist:
        raise ValidationError(f"Organization with id '{org_id}' not found.")

    if not org.users.filter(pk=user.pk).exists():
        raise ValidationError(f"User '{user}' is not a member of organization '{org.name}'.")

    try:
        return PermissionGroup.objects.get(
            organization=org,
            template__name=template_name,
        )
    except PermissionGroup.DoesNotExist:
        raise ValidationError(
            f"Permission group for template '{template_name}' not found " f"in organization '{org.name}'."
        )

from accounts.permissions import UserOrganizationPermissions
from organizations.models import Organization
from rest_framework.permissions import BasePermission


class HasOrgPortalAccess(BasePermission):
    """
    DRF permission that checks the user belongs to an organization
    and has the ACCESS_ORG_PORTAL object-level permission on it.
    """

    message = "You do not have permission to access reports."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        org = Organization.objects.filter(users=user).first()
        if org is None:
            return False

        return user.has_perm(UserOrganizationPermissions.ACCESS_ORG_PORTAL, org)

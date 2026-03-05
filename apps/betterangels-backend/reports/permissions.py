"""
Reports app DRF permissions.

Reference: https://github.com/HackSoftware/Django-Styleguide#apis--serializers
"""

from accounts.permissions import UserOrganizationPermissions, get_user_permitted_org
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

# Single permission — if you have VIEW_REPORTS on an org, you can see its reports.
REPORT_PERMISSION = UserOrganizationPermissions.VIEW_REPORTS


class HasReportAccess(BasePermission):
    """
    DRF permission that checks the user belongs to an organization
    and has ``VIEW_REPORTS`` permission on it.

    Reads an optional ``org_id`` query-parameter to target a specific org.
    On success the permitted organization is stored on ``request.permitted_org``
    so the view can reuse it without a duplicate query.
    """

    message = "You do not have permission to access reports."

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user

        if not user or not user.is_authenticated:
            return False

        org_id = request.query_params.get("org_id")
        org = get_user_permitted_org(user, [REPORT_PERMISSION], org_id=org_id)
        if org is None:
            return False

        request.permitted_org = org  # type: ignore[attr-defined]
        return True

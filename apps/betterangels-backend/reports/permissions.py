"""
Reports app DRF permissions.

Reference: https://github.com/HackSoftware/Django-Styleguide#apis--serializers
"""

from common.permissions.utils import register_permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


@register_permission
class ReportPermissions(models.TextChoices):
    VIEW_REPORTS = "reports.view_reports", _("Can view reports")


class HasReportAccess(BasePermission):
    """
    DRF permission that checks the user belongs to an organization
    and has ``VIEW_REPORTS`` permission on it (via a Grant or, during the
    §5.3 transition, a legacy PermissionGroup).

    Reads an optional ``org_id`` query-parameter to target a specific org.
    On success the permitted organization is stored on ``request.permitted_org``
    so the view can reuse it without a duplicate query.
    """

    message = "You do not have permission to access reports."

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user

        if not user.is_authenticated:
            return False

        org_id = request.query_params.get("org_id")
        if not org_id:
            return False

        from common.permissions.selectors import permitted_org

        org = permitted_org(user, ReportPermissions.VIEW_REPORTS.value, org_id=org_id)
        if org is None:
            return False

        request.permitted_org = org  # type: ignore[attr-defined]
        return True

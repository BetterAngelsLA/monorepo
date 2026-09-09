"""
Reports app DRF permissions.

Reference: https://github.com/HackSoftware/Django-Styleguide#apis--serializers
"""

from common.permissions.selectors import can
from common.permissions.utils import register_permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from organizations.models import Organization
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


@register_permission
class ReportPermissions(models.TextChoices):
    VIEW_REPORTS = "reports.view_reports", _("Can view reports")


class HasReportAccess(BasePermission):
    """
    DRF permission that checks the user ``can()`` view reports at the target org.

    Reads the ``org_id`` query-parameter to target a specific org and requires
    ``reports.view_reports`` there via :func:`common.permissions.selectors.can`
    — role-backed ORG_ADMIN/ORG_SUPERUSER backfilled Grants, or the global tier
    (ADR 0001 §5.3, reports cutover).  Org membership is no longer consulted.
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

        # Fail closed on an unknown org id (no DoesNotExist), then require the
        # grant at that org.
        org = Organization.objects.filter(pk=org_id).first()
        if org is None:
            return False

        if not can(user, ReportPermissions.VIEW_REPORTS, org=org):
            return False

        request.permitted_org = org  # type: ignore[attr-defined]
        return True

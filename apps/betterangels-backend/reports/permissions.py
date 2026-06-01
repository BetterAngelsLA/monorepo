"""
Reports app DRF permissions.

Reference: https://github.com/HackSoftware/Django-Styleguide#apis--serializers
"""

import strawberry
from accounts.permissions import get_user_permitted_org
from django.db import models
from django.utils.translation import gettext_lazy as _
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


@strawberry.enum
class ReportPermissions(models.TextChoices):
    VIEW_REPORTS = "reports.view_reports", _("Can view reports")


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
        if not org_id:
            return False

        org = get_user_permitted_org(user, org_id=org_id, permission=ReportPermissions.VIEW_REPORTS)
        if org is None:
            return False

        request.permitted_org = org  # type: ignore[attr-defined]
        return True

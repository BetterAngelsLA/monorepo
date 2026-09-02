"""
Reports app DRF permissions.

Reference: https://github.com/HackSoftware/Django-Styleguide#apis--serializers
"""

from accounts.models import User
from accounts.permissions import get_user_permitted_org
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


def report_org_for_user(user: User, org_id: str) -> Organization | None:
    """The organization *user* may view reports for — grant arm OR legacy (§5.3).

    Transitional dual-read.  ``view_reports`` rides the legacy
    ``ORG_ADMIN``/``ORG_SUPERUSER`` templates (no scoped Role row yet, so no
    Grants exist for it); the legacy arm (``get_user_permitted_org``) preserves
    today's behavior while the grant arm (``can()``) is the end-state
    authority and stays dormant until the §5.3 provisioning PR role-backs the
    template and backfills Grants.  The legacy arm runs first — it is today's
    authority and keeps the common path at a single query.  This helper is
    deleted in that PR.
    """
    from common.permissions.selectors import can

    org = get_user_permitted_org(user, org_id=org_id, permission=ReportPermissions.VIEW_REPORTS)
    if org is not None:
        return org

    if can(user, ReportPermissions.VIEW_REPORTS, org=int(org_id)):
        # ``can()`` never implies existence (ADR 0001 §2.6, finding F7).
        return Organization.objects.filter(pk=org_id).first()
    return None


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

        org = report_org_for_user(user, org_id)
        if org is None:
            return False

        request.permitted_org = org  # type: ignore[attr-defined]
        return True

"""
Reports app DRF permissions.

Reference: https://github.com/HackSoftware/Django-Styleguide#apis--serializers
"""

from accounts.models import User
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
    """The organization *user* may view reports for — the transition seam (§5.3).

    ``view_reports`` rides the legacy ``ORG_ADMIN``/``ORG_SUPERUSER`` templates.
    The dual-read is delegated to
    :func:`common.permissions.selectors.permitted_org` (the legacy org-scoped
    check while the template is legacy, then the grant ``can()`` once it is
    role-backed and backfilled) — one seam for every consumer.  This wrapper is
    deleted at phase 5.
    """
    from common.permissions.selectors import permitted_org

    return permitted_org(user, ReportPermissions.VIEW_REPORTS, org_id=org_id)


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

from __future__ import annotations

from typing import Optional, Union

from common.permissions.utils import perm_filter, register_permission
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.db import models
from django.db.models import TextChoices
from django.utils.translation import gettext_lazy as _
from organizations.models import Organization

UserLike = Union[AbstractBaseUser, AnonymousUser]


# ── Permission enums ──────────────────────────────────────────────────────────


@register_permission
class UserOrganizationPermissions(models.TextChoices):
    ACCESS_ORG_PORTAL = "organizations.access_org_portal", _("Can access organization management portal")
    ADD_ORG_MEMBER = "organizations.add_org_member", _("Can add organization member")
    CHANGE_ORG_MEMBER_ROLE = "organizations.change_org_member_role", _("Can change organization member role")
    REMOVE_ORG_MEMBER = "organizations.remove_org_member", _("Can remove organization member")
    VIEW_ORG_MEMBERS = "organizations.view_org_members", _("Can view organization members")


# ── Organization permission check ─────────────────────────────────────────────


def get_user_permitted_org(
    user: UserLike,
    org_id: str,
    permission: str | TextChoices,
) -> Optional[Organization]:
    """Return an organization filtered by org_id, user membership in a
    permission group, and the given permission.

    *permission* should be a ``TextChoices`` enum member whose value is
    ``"app_label.codename"`` (e.g. ``ReportPermissions.VIEW_REPORTS``), or
    a plain ``"app_label.codename"`` string.

    Returns ``None`` when the user does not belong to the organization
    or does not hold the required permission.

    This helper never applies org-bypass: org-bypassing roles
    (``TemplateConfig.bypasses_org_scoping``) are treated strictly org-scoped
    here, unlike :func:`common.permissions.utils.permissioned_queryset` and
    :class:`accounts.extensions.HasOrgPerm`.  A holder is confined to the
    organization hosting their permission group regardless of whether their
    bypass template carries *permission* — this is a hard boundary, not a
    per-surface carve-out.

    Consequence: if a bypass template ever holds a permission gated through
    this path (e.g. org member views, reports), its holder would gain
    cross-org access via ``permissioned_queryset``/``HasOrgPerm`` but stay
    org-scoped here.  That asymmetry is deliberate to keep admin/portal
    surfaces confined, but it must stay a conscious decision — granting such
    a permission to a bypass template without revisiting this helper would
    silently split behavior between the two check paths.
    """
    perm_value = permission.value if isinstance(permission, TextChoices) else permission
    app_label, codename = perm_value.split(".", 1)
    return (
        Organization.objects.filter(
            pk=org_id,
            permission_groups__user=user,
        )
        .filter(perm_filter(app_label, codename))
        .first()
    )

from __future__ import annotations

from common.permissions.utils import register_permission
from django.db import models
from django.utils.translation import gettext_lazy as _


# ── Permission enums ──────────────────────────────────────────────────────────


@register_permission
class UserOrganizationPermissions(models.TextChoices):
    ACCESS_ORG_PORTAL = "organizations.access_org_portal", _("Can access organization management portal")
    ADD_ORG_MEMBER = "organizations.add_org_member", _("Can add organization member")
    CHANGE_ORG_MEMBER_ROLE = "organizations.change_org_member_role", _("Can change organization member role")
    REMOVE_ORG_MEMBER = "organizations.remove_org_member", _("Can remove organization member")
    VIEW_ORG_MEMBERS = "organizations.view_org_members", _("Can view organization members")


class OrganizationAdminPermissions(models.TextChoices):
    """Django default perms on the django-organizations models.

    Consumed only by the Django admin via ``ModelBackend.has_perm``, so this is
    deliberately NOT ``@register_permission``-ed — these must not leak into the
    generated frontend permission consts.  The models come from the third-party
    ``django-organizations`` package and declare no ``perms`` PermissionSet,
    which is why these are constants rather than ``Model.perms.*``.
    """

    ADD_ORGANIZATION = "organizations.add_organization", _("Can add organization")
    CHANGE_ORGANIZATION = "organizations.change_organization", _("Can change organization")
    VIEW_ORGANIZATION = "organizations.view_organization", _("Can view organization")
    VIEW_ORGANIZATION_USER = "organizations.view_organizationuser", _("Can view organization user")

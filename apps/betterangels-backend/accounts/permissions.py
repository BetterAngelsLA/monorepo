from __future__ import annotations

from typing import Optional, Union

from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.db import models
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _
from organizations.models import Organization

UserLike = Union[AbstractBaseUser, AnonymousUser]


class UserOrganizationPermissions(models.TextChoices):
    ACCESS_ORG_PORTAL = "organizations.access_org_portal", _("Can access organization management portal")
    ADD_ORG_MEMBER = "organizations.add_org_member", _("Can add organization member")
    CHANGE_ORG_MEMBER_ROLE = "organizations.change_org_member_role", _("Can change organization member role")
    REMOVE_ORG_MEMBER = "organizations.remove_org_member", _("Can remove organization member")
    VIEW_ORG_MEMBERS = "organizations.view_org_members", _("Can view organization members")


def get_user_permitted_orgs(
    user: UserLike,
) -> "QuerySet[Organization]":
    """Return orgs the user belongs to."""
    return Organization.objects.filter(users=user)


def get_user_permitted_org(
    user: UserLike,
    org_id: Optional[str] = None,
    permission: Optional[str] = None,
) -> Optional[Organization]:
    """Return a single org the user belongs to, optionally requiring a permission.

    If *org_id* is given the user must be a member of that specific org.
    Otherwise falls back to the first org.

    If *permission* is given (e.g. "reports.view_reports"), additionally
    verifies the user holds that permission on the org via PermissionGroups
    — all in a single query.
    """
    qs = get_user_permitted_orgs(user)
    if org_id:
        qs = qs.filter(pk=org_id)
    if permission:
        app_label, codename = permission.split(".")
        qs = qs.filter(
            permission_groups__group__user=user,
            permission_groups__group__permissions__content_type__app_label=app_label,
            permission_groups__group__permissions__codename=codename,
        )
    return qs.first()

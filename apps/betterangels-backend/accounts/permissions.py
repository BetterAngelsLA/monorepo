from __future__ import annotations

from typing import Optional, Sequence, Union

import strawberry
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.db import models
from django.db.models import Q, QuerySet
from django.utils.translation import gettext_lazy as _
from organizations.models import Organization

UserLike = Union[AbstractBaseUser, AnonymousUser]


@strawberry.enum(name="UserOrgPermission")  # type: ignore[misc]
class UserOrganizationPermissions(models.TextChoices):
    ACCESS_ORG_PORTAL = "organizations.access_org_portal", _("Can access organization management portal")
    ADD_ORG_MEMBER = "organizations.add_org_member", _("Can add organization member")
    CHANGE_ORG_MEMBER_ROLE = "organizations.change_org_member_role", _("Can change organization member role")
    REMOVE_ORG_MEMBER = "organizations.remove_org_member", _("Can remove organization member")
    VIEW_ORG_MEMBERS = "organizations.view_org_members", _("Can view organization members")


def get_user_permitted_orgs(
    user: UserLike,
    permissions: Sequence[str] = (),
    *,
    any_perm: bool = True,
) -> QuerySet[Organization]:
    """Return orgs where the user has the specified permission(s).

    Queries through PermissionGroup -> Group -> Permission relationships.
    Works with permissions from any app namespace.

    Args:
        permissions: Optional sequence of permission strings (e.g. "reports.view_reports").
            If empty, returns all orgs the user belongs to.
        any_perm: When *True* (default) the user needs **any** of the
            listed permissions. Set to *False* to require **all** of them.
    """
    if not user or getattr(user, "is_anonymous", True):
        return Organization.objects.none()  # type: ignore[no-any-return]

    qs: QuerySet[Organization] = Organization.objects.filter(users=user)

    if not permissions:
        return qs

    codenames = [p.split(".")[-1] for p in permissions]
    app_labels = {p.split(".")[0] for p in permissions if "." in p}

    perm_q = Q(
        permission_groups__group__user=user,
        permission_groups__group__permissions__codename__in=codenames,
    )
    if app_labels:
        perm_q &= Q(
            permission_groups__group__permissions__content_type__app_label__in=app_labels,
        )

    qs = qs.filter(perm_q).distinct()

    if not any_perm and len(codenames) > 1:
        # Require ALL permissions — filter orgs that have every codename
        for codename in codenames:
            qs = qs.filter(
                permission_groups__group__user=user,
                permission_groups__group__permissions__codename=codename,
            )

    return qs


def get_user_permitted_org(
    user: UserLike,
    org_id: Optional[str] = None,
    permission: Optional[str] = None,
    permissions: Sequence[str] = (),
    *,
    any_perm: bool = True,
) -> Optional[Organization]:
    """Return a single org the user has permissions on.

    If *org_id* is given the user must have permissions on that specific org.
    Otherwise returns the first permitted org.

    Accepts either a single *permission* string (legacy) or a *permissions* sequence.
    """
    perm_list: Sequence[str] = permissions or ((permission,) if permission else ())
    qs = get_user_permitted_orgs(user, perm_list, any_perm=any_perm)
    if org_id:
        return qs.filter(pk=org_id).first()
    return qs.first()

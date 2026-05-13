from __future__ import annotations

from typing import Optional, Sequence, Union, cast

from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.db import models
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _
from organizations.models import Organization
from strawberry_django.utils.query import filter_for_user

UserLike = Union[AbstractBaseUser, AnonymousUser]


class UserOrganizationPermissions(models.TextChoices):
    ACCESS_ORG_PORTAL = "organizations.access_org_portal", _("Can access organization management portal")
    ADD_ORG_MEMBER = "organizations.add_org_member", _("Can add organization member")
    CHANGE_ORG_MEMBER_ROLE = "organizations.change_org_member_role", _("Can change organization member role")
    REMOVE_ORG_MEMBER = "organizations.remove_org_member", _("Can remove organization member")
    VIEW_ORG_MEMBERS = "organizations.view_org_members", _("Can view organization members")


def get_user_permitted_orgs(
    user: UserLike,
    permissions: Sequence[str],
    *,
    any_perm: bool = True,
) -> "QuerySet":
    """Return orgs the user belongs to and has *permissions* on.

    Uses ``filter_for_user`` which checks both standard Django group
    permissions and guardian object-level permissions.

    Args:
        any_perm: When *True* (default) the user needs **any** of the
            listed permissions.  Set to *False* to require **all** of them.
    """

    return cast(
        QuerySet,
        filter_for_user(
            Organization.objects.filter(users=user),
            user,
            list(permissions),
            any_perm=any_perm,
        ),
    )


def get_user_permitted_org(
    user: UserLike,
    permissions: Sequence[str],
    org_id: Optional[str] = None,
    *,
    any_perm: bool = True,
) -> Optional[Organization]:
    """Return a single org the user has *permissions* on.

    If *org_id* is given the user must have permissions on that specific org.
    Otherwise falls back to the first permitted org.
    """
    qs = get_user_permitted_orgs(user, permissions, any_perm=any_perm)
    if org_id:
        return qs.filter(pk=org_id).first()
    return qs.first()

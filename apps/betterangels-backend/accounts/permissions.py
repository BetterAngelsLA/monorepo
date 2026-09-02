from __future__ import annotations

from typing import Optional, Union

from common.permissions.utils import perm_filter, register_permission
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.db import models
from django.db.models import Q, TextChoices
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
    """
    perm_value = permission.value if isinstance(permission, TextChoices) else permission
    app_label, codename = perm_value.split(".", 1)
    # Both conditions MUST stay in a single ``.filter()`` call: ``permission_groups``
    # is multi-valued, so chaining them as two ``.filter()`` calls builds two
    # independent joins that different groups can satisfy — "user is in some group
    # of this org, and some group of this org has the permission".  Every org is
    # provisioned with every template, so that reads as "any member holds every
    # permission any template in their org has" (see
    # ``common.permissions.utils._org_perm_exists_across_fields``).
    return (
        Organization.objects.filter(pk=org_id)
        .filter(Q(permission_groups__user=user) & perm_filter(app_label, codename))
        .first()
    )


def get_user_permitted_org_dual(
    user: UserLike,
    org_id: str,
    permission: str | TextChoices,
) -> Optional[Organization]:
    """The org *user* may act on — the transition seam (§5.3).

    Transitional dual-read used by the member-management queries, whose
    authority template (``ORG_ADMIN`` / ``ORG_SUPERUSER``) is still legacy.
    Delegates to :func:`common.permissions.selectors.permitted_org` (legacy
    org-scoped check OR grant ``can()``) — one seam for every consumer.
    Deleted at phase 5.
    """
    from accounts.models import User
    from common.permissions.selectors import permitted_org

    if not isinstance(user, User):
        return None

    perm_value = permission.value if isinstance(permission, TextChoices) else permission
    return permitted_org(user, perm_value, org_id=org_id)

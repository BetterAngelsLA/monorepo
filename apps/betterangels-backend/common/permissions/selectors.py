"""Read-side authorization selectors (ADR 0001 §2.4, §2.9).

Pull-only: given a user, a permission, and a queryset, return the rows the user
may exercise that permission on.  Follows the repo's service/selector pattern
(docs/styleguides/python.md): no side effects; memoized per request on the user
instance, mirroring ``ModelBackend._perm_cache``.

The global tier is read explicitly (superuser, global Role in ``user.groups``,
``user_permissions``) — NOT ``user.has_perm`` — until the legacy
``PermissionGroup`` rows (which pollute ``has_perm``) are gone; it collapses to
``has_perm`` at teardown.
"""

from __future__ import annotations

from functools import reduce
from operator import or_
from typing import TYPE_CHECKING, Any

from django.db.models import Q, Subquery

if TYPE_CHECKING:
    from accounts.models import User
    from django.db.models import Model, QuerySet

ALL = object()
"""Sentinel for the global tier — row-invariant, so ``visible`` hoists it."""


def _perm_parts(perm: str) -> tuple[str, str]:
    app_label, codename = perm.split(".", 1)
    return app_label, codename


def _global_role_holds(user: "User", perm: str) -> bool:
    """Whether *user* holds *perm* at the global tier through a global Role."""
    app_label, codename = _perm_parts(perm)
    return user.groups.filter(
        role__is_global=True,
        role__permissions__content_type__app_label=app_label,
        role__permissions__codename=codename,
    ).exists()


def _user_permission_holds(user: "User", perm: str) -> bool:
    """Whether *user* holds *perm* directly via ``user_permissions``."""
    app_label, codename = _perm_parts(perm)
    return user.user_permissions.filter(content_type__app_label=app_label, codename=codename).exists()


def _roles_carrying_perm(perm: str) -> "QuerySet":
    """Scoped ``Role`` ids that carry *perm* — the roles a Grant may reference."""
    app_label, codename = _perm_parts(perm)
    from accounts.models import Role

    return Role.objects.filter(
        is_global=False,
        permissions__content_type__app_label=app_label,
        permissions__codename=codename,
    ).values("pk")


def scopes(user: "User", perm: str) -> Any:
    """``ALL``, or the org ids where *user* holds *perm* through a scoped Grant.

    Memoized per request on the user instance.  The cached value is a lazy
    queryset used as a subquery — caching it does not evaluate it.
    """
    if user.is_superuser or _global_role_holds(user, perm) or _user_permission_holds(user, perm):
        return ALL

    from accounts.models import Grant

    cache = user.__dict__.setdefault("_scope_cache", {})
    if perm not in cache:
        roles = _roles_carrying_perm(perm)
        cache[perm] = Grant.objects.filter(principal_user=user, role__in=Subquery(roles)).values("scope_org")
    return cache[perm]


def visible(qs: "QuerySet", user: "User", perm: str, *, in_org: str | None = None) -> "QuerySet":
    """The rows of *qs* on which *user* may exercise *perm*.

    * ``ALL`` (global tier) — the queryset, unconfined.
    * platform-shared model (``org_via = None``) — all rows when *user* holds
      *perm* anywhere, none otherwise.
    * org-scoped model — rows whose org is in *user*'s scopes.
    * model not declared ``OrgScoped`` — fails closed (no rows).

    *in_org* confines the view to one organization, and only for finite scopes —
    a global holder is never org-confined by a stale header (ADR 0001 §2.4).
    """
    from common.models import OrgScoped

    if not issubclass(qs.model, OrgScoped):
        return qs.none()

    paths = qs.model.org_paths()
    s = scopes(user, perm)

    if s is ALL:
        qs = qs
    elif not paths:
        # platform-shared: perm held anywhere (finite s) ⇒ all rows
        qs = qs if s.exists() else qs.none()
    elif s:
        qs = qs.filter(reduce(or_, (Q(**{f"{p}__in": s}) for p in paths)))
    else:
        qs = qs.none()

    if in_org is not None and s is not ALL and paths:
        qs = qs.filter(reduce(or_, (Q(**{p: in_org}) for p in paths)))
    return qs


def can(user: "User", perm: str, *, org: Any) -> bool:
    """Authority in an organization — the check for creates, which have no row yet."""
    from accounts.models import Grant

    s = scopes(user, perm)
    if s is ALL:
        return True
    return Grant.objects.filter(scope_org=org, scope_org__in=Subquery(s)).exists()


def can_obj(user: "User", perm: str, obj: "Model") -> bool:
    """The single-row check *is* the row filter, applied to one row."""
    return visible(obj.__class__._base_manager.filter(pk=obj.pk), user, perm).exists()


def can_anywhere(user: "User", perm: str) -> bool:
    """Authority anywhere — the check for creates on platform-shared models."""
    s = scopes(user, perm)
    return s is ALL or s.exists()

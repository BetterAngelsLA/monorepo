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

OBJECT_ARM_ENABLED = True
"""Object-grant arm (ADR 0001 §2.5) — on with its first consumer (clients).

Only whitelisted models are object-grantable (``permissions.E003``), so the arm
is a no-op for every other model; it is safe to leave on.
"""


def _object_grant_ancestors(model: Any) -> list[tuple[str, type["Model"]]]:
    """(FK lookup path to parent id, parent model) for every object-grantable ancestor.

    Derived from ``org_via`` (ADR 0001 §2.3): an object grant on an ancestor —
    e.g. a Shelter — covers its descendants (beds, rooms, ...) through their FK
    paths.  A non-``OrgScoped`` hop is skipped defensively.
    """
    results: list[tuple[str, type["Model"]]] = []
    for hop in model.org_via or ():
        field = model._meta.get_field(hop)
        target = field.related_model
        if target is None:
            continue
        results.append((f"{field.name}_id", target))
        for sub_path, sub_ct in _object_grant_ancestors(target):
            results.append((f"{field.name}__{sub_path}", sub_ct))
    return results


def _object_grant_q(model: Any, user: "User", perm: str) -> Q:
    """Q matching rows of *model* the user holds *perm* on via an object grant.

    Direct — an object grant on the row itself — plus the cascade: an object
    grant on an ancestor (an ``org_via`` hop target) covers descendants through
    their FK paths (ADR 0001 §2.5, finding F17).  Grants are always scoped to
    *user* (the principal).  Only whitelisted models are object-grantable, so
    grants on non-whitelisted ancestors cannot exist and non-whitelisted models
    fail closed.
    """
    from django.contrib.contenttypes.models import ContentType

    from accounts.models import Grant
    from common.permissions.object_grants import object_grant_whitelist

    if not any(issubclass(model, cls) for cls in object_grant_whitelist()):
        return Q(pk__lt=0)

    roles = _roles_carrying_perm(perm)
    direct_ct = ContentType.objects.get_for_model(model)
    q = Q(
        pk__in=Grant.objects.filter(
            principal_user=user,
            scope_object_type=direct_ct,
            role__in=Subquery(roles),
        ).values("scope_object_id")
    )

    for path, target in _object_grant_ancestors(model):
        ct = ContentType.objects.get_for_model(target)
        q |= Q(
            **{
                f"{path}__in": Grant.objects.filter(
                    principal_user=user,
                    scope_object_type=ct,
                    role__in=Subquery(roles),
                ).values("scope_object_id")
            }
        )
    return q


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


def global_permissions(user: "User") -> list[str]:
    """The global-tier permission list (ADR 0001 §2.4, finding F24).

    The shared contract the frontend gates global-tier features on: a
    superuser holds every permission; otherwise the union of direct
    ``user_permissions`` and permissions carried by global Roles in
    ``user.groups``.  Scoped (Grant) permissions are NOT included here —
    they are per-organization and reported per org.
    """
    from django.contrib.auth.models import Permission

    if user.is_superuser:
        perms = Permission.objects.all().values_list("content_type__app_label", "codename")
        return sorted(f"{app}.{codename}" for app, codename in perms)

    direct = user.user_permissions.values_list("content_type__app_label", "codename")
    role_held = Permission.objects.filter(group__role__is_global=True, group__user=user).values_list(
        "content_type__app_label", "codename"
    )
    return sorted(
        {f"{app}.{codename}" for app, codename in direct} | {f"{app}.{codename}" for app, codename in role_held}
    )


def scopes(user: "User", perm: str) -> Any:
    """``ALL``, or the org ids where *user* holds *perm* (direct or delegated).

    * Direct — a user-principal ``Grant``.
    * Delegated — an org-principal ``Grant`` inherited by the principal org's
      people: "acts at B" = member of B AND holds a direct Grant at B whose role
      carries *this* permission (role-keyed — a weak-role holder at B is not
      amplified to B's stronger delegated roles at C).  A consultant granted a
      role at B without membership does NOT inherit — no amplification (ADR 0001
      §2.4, findings F1/F19).  One hop only.

    Memoized per request on the user instance — the **whole** decision, global
    tier included: the superuser / global-Role / ``user_permissions`` checks are
    EXISTS queries, and a shelter page checks the same permission on several
    fields, so they must not re-run per call.  The cached value is either the
    ``ALL`` sentinel or a lazy queryset used as a subquery — caching it does not
    evaluate it.
    """
    from accounts.models import Grant, Organization

    cache = user.__dict__.setdefault("_scope_cache", {})
    if perm not in cache:
        if user.is_superuser or _global_role_holds(user, perm) or _user_permission_holds(user, perm):
            cache[perm] = ALL
        else:
            roles = _roles_carrying_perm(perm)
            # Org-scope arm only: object grants (scope_org IS NULL) never feed the
            # org filter — they are per-record and handled by the object arm.
            mine = Grant.objects.filter(principal_user=user, role__in=Subquery(roles), scope_org__isnull=False).values(
                "scope_org"
            )

            # Delegation: orgs where the user acts (member + holds a direct Grant
            # at that org) inherit that org's org→org delegations.  "Acts at B" is
            # role-keyed: the grant at B must carry *this* permission's role, or a
            # member holding only a weak role at B would inherit everything B
            # delegated at C — more authority at C than at B (audit C-1).
            acting_at = (
                Organization.objects.filter(
                    users=user,
                    grants__principal_user=user,
                    grants__role__in=Subquery(roles),
                )
                .values("pk")
                .distinct()
            )
            # Org-scope arm only on inherited delegations too: object grants
            # (scope_org IS NULL) never feed the org filter.
            inherited = Grant.objects.filter(
                principal_org__in=Subquery(acting_at),
                role__in=Subquery(roles),
                scope_org__isnull=False,
            ).values("scope_org")

            cache[perm] = mine.union(inherited)
    return cache[perm]


def visible(qs: "QuerySet", user: "User", perm: str, *, in_org: str | None = None) -> "QuerySet":
    """The rows of *qs* on which *user* may exercise *perm*.

    * ``ALL`` (global tier) — the queryset, unconfined.
    * platform-shared model (``org_via = None``) — all rows when *user* holds
      *perm* anywhere, none otherwise.
    * org-scoped model — rows whose org is in *user*'s scopes.
    * model not declared ``OrgScoped`` — fails closed (no rows).

    The object arm (ADR 0001 §2.5) is OR'd with the org filter in a single
    ``filter``, so per-record object grants can add rows on top of a
    deliberately-empty org scope.  ``pk__lt=0`` is the "impossible" condition —
    it compiles to a normal always-false predicate instead of Django's
    ``EmptyResultSet`` short-circuit, which would swallow the object arm.

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
    else:
        if not paths:
            # platform-shared: perm held anywhere (finite s) ⇒ all rows (identity
            # org filter), else nothing (``pk__lt=0`` — an always-false predicate
            # that compiles normally, unlike Django's EmptyResultSet short-circuit).
            org_q: Q | None = None if s.exists() else Q(pk__lt=0)
        elif s:
            org_q = reduce(or_, (Q(**{f"{p}__in": s}) for p in paths))
        else:
            org_q = Q(pk__lt=0)

        if in_org is not None and paths and org_q is not None:
            org_q &= reduce(or_, (Q(**{p: in_org}) for p in paths))

        if org_q is None:
            # Every row is already visible — the object arm cannot add more.
            qs = qs
        elif OBJECT_ARM_ENABLED:
            qs = qs.filter(org_q | _object_grant_q(qs.model, user, perm))
        else:
            qs = qs.filter(org_q)
    return qs


def can(user: "User", perm: str, *, org: Any) -> bool:
    """Authority in an organization — the check for creates, which have no row yet."""
    from accounts.models import Grant

    s = scopes(user, perm)
    if s is ALL:
        return True
    return Grant.objects.filter(scope_org=org, scope_org__in=Subquery(s)).exists()


def can_obj(user: "User", perm: str, obj: "Model") -> bool:
    """The single-row check *is* the row filter, applied to one row.

    Org-scoped model — the row falls in the user's scopes (the ``visible`` org
    filter on a one-row queryset).

    Platform-shared model (``org_via = None``) — per-record authority comes
    from the object arm (or the global tier), **not** from "holds the perm
    anywhere".  The read rule (perm held anywhere ⇒ all rows) must not leak
    into per-record writes: an org-grant holder of a client perm would
    otherwise be able to CHANGE/DELETE *every* client (finding C1).  Write
    services on platform-shared models must use ``can_obj`` (or the object
    arm), never the read-side ``visible``, to load records for mutation.
    """
    from common.models import OrgScoped

    model = obj.__class__
    if not issubclass(model, OrgScoped):
        return False

    s = scopes(user, perm)
    if s is ALL:
        return True

    if not model.org_paths():
        # Platform-shared: an object grant on this row is the only scoped path
        # (a non-whitelisted model fails closed — ``_object_grant_q`` is False).
        return model._base_manager.filter(pk=obj.pk).filter(_object_grant_q(model, user, perm)).exists()

    return visible(model._base_manager.filter(pk=obj.pk), user, perm).exists()


def can_anywhere(user: "User", perm: str) -> bool:
    """Authority anywhere — the check for creates on platform-shared models."""
    s = scopes(user, perm)
    return s is ALL or s.exists()

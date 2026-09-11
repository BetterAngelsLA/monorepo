"""Authorization selectors (ADR 0001 §2.4, §2.10, RFC 0002 §Precondition).

Pull-only: given a user, a permission, and (usually) a queryset, answer what
authority the user holds.  This module is the single place the org-scope and
write-tier rules live; it follows the repo's service/selector pattern
(docs/styleguides/python.md): no side effects; memoized per request on the user
instance, mirroring ``ModelBackend._perm_cache``.

Layers, scope math to mutation gate:

* ``scopes`` / ``global_permissions`` — the raw material: the org set (or
  ``ALL``) in which the user holds *perm*.
* ``visible`` / ``writable`` — the **queryset** layer: scope a queryset to the
  rows the user may exercise *perm* on, for reads / writes respectively.
  Callers compose freely on the result (``get``, ``first``,
  ``filter(…).exists()``) — or take the whole row set for a list.
* ``can`` / ``can_obj`` / ``can_anywhere`` — verdicts: authority at an org
  (creates), on one row (``can_obj`` is ``writable`` applied to a row), or
  anywhere.
* ``get_writable_or_deny`` (``common.permissions.utils``) — the mutation
  leaf: fetch a write target through ``writable``, or deny.  Mutation gates
  fetch through it (or through ``writable`` directly for non-pk shapes) —
  never from a raw manager.

Read scope and write scope are chosen independently (RFC 0002 §Precondition):
``visible`` answers the read rule, ``writable`` the write rule — one is never
reused for the other (a SHARED-read model still writes org-scoped).

The global tier is read explicitly (superuser, global Role in ``user.groups``,
``user_permissions``) — NOT ``user.has_perm`` — until the legacy
``PermissionGroup`` rows (which pollute ``has_perm``) are gone; it collapses to
``has_perm`` at teardown.
"""

from __future__ import annotations

from functools import reduce
from operator import or_
from typing import TYPE_CHECKING, Any, Optional, cast

from django.db.models import Exists, OuterRef, Q, Subquery

if TYPE_CHECKING:
    from accounts.models import User
    from django.db.models import Model, QuerySet
    from organizations.models import Organization

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


def global_permissions(user: "User") -> list[str]:
    """Global-tier permission list (ADR 0001 §2.4, finding F24).

    Superuser → every product-modeled permission (the registry the FE
    ``PermissionEnum`` is generated from), never the whole DB catalog, which
    would ship admin-internal permissions (``auth.*``, ``admin.*``, …) the
    product cannot gate on; otherwise direct ``user_permissions`` ∪ global-Role
    permissions, bounded to the modeled set.  Scoped (Grant) permissions are
    per-org and reported there, not here.

    Request-scoped and memoized on the user instance (house pattern: ``scopes``).
    """
    from django.contrib.auth.models import Permission

    cached: Optional[list[str]] = user.__dict__.get("_global_permissions")
    if cached is not None:
        return cached

    from common.permissions.utils import modeled_permission_strings

    modeled = modeled_permission_strings()
    if user.is_superuser:
        rows: list[tuple[str, str]] = list(Permission.objects.all().values_list("content_type__app_label", "codename"))
    else:
        direct = user.user_permissions.values_list("content_type__app_label", "codename")
        role_held = Permission.objects.filter(group__role__is_global=True, group__user=user).values_list(
            "content_type__app_label", "codename"
        )
        rows = [*direct, *role_held]
    result = sorted({f"{app}.{codename}" for app, codename in rows if f"{app}.{codename}" in modeled})
    user.__dict__["_global_permissions"] = result
    return result


def _finite_org_scope(user: "User") -> "QuerySet[Organization]":
    """Member ∪ direct-grant ∪ delegated orgs — the finite switchable set.

    Backs :func:`switchable_orgs` (the FE org list / switcher).  The delegated
    arm mirrors ``scopes()``: a delegation B→C is reachable only when the user
    acts at B (member of B AND a direct Grant at B) with a role that shares at
    least one permission with the delegation's role — so a delegated org never
    appears when no permission in ``scopes()`` would ever yield it.
    """
    from accounts.models import Grant, Organization, Role

    roles_at_b = Role.objects.filter(
        grants__principal_user=user,
        grants__scope_org=OuterRef("principal_org_id"),
        grants__scope_org__users=user,
    )
    delegated = Grant.objects.filter(
        role__permissions__in=Subquery(roles_at_b.values("permissions__pk")),
        principal_org__isnull=False,
        scope_org__isnull=False,
    ).values("scope_org")

    return cast(
        "QuerySet[Organization]",
        Organization.objects.filter(
            Q(pk__in=Organization.objects.filter(users=user).values("pk"))
            | Q(pk__in=Grant.objects.filter(principal_user=user, scope_org__isnull=False).values("scope_org"))
            | Q(pk__in=delegated)
        ),
    )


def switchable_orgs(user: "User") -> "QuerySet[Organization]":
    """The FE org list / switcher (ADR 0001 §5.2 refinement, §7 item 7).

    Member ∪ direct-grant ∪ delegated orgs — the orgs the user can switch to in
    the UI.  Deliberately NEVER expanded to every org for a global holder: a
    global user's cross-org reach is expressed through unscoped reads
    (``visible()`` never confines a global holder — ADR 0001 §2.6) and
    ``currentUser.permissions``, not by enumerating the platform.  Lazy
    subquery form.
    """
    return _finite_org_scope(user)


def scopes(user: "User", perm: str) -> Any:
    """``ALL``, or the org ids where *user* holds *perm* (direct or delegated).

    * Direct — a user-principal ``Grant``.
    * Delegated — an org-principal ``Grant`` inherited by the principal org's
      people: "acts at B" = member of B AND holds a direct Grant at B whose role
      carries *this* permission (permission-matched: the delegated role's bundle
      is the ceiling, and a weak-role holder at B is not amplified to B's
      stronger delegated roles at C).  A consultant granted a role at B without
      membership does NOT inherit — no amplification (ADR 0001 §2.4, findings
      F1/F19).  One hop only.  Revocation is row-driven: removing the membership,
      the direct grant, or the delegation row drops the scope on the next request
      (RFC 0002 revoke-on-exit); account deactivation (``User.is_active``) is an
      authentication-layer gate, not consulted here.

    Object grants (``scope_org`` NULL) are excluded so they can never register
    as an org scope or as "holds the perm somewhere" for a platform-shared model.

    Memoized per request on the user instance.  The cached value is a lazy
    queryset used as a subquery — caching it does not evaluate it.  Authority
    write services invalidate it via :func:`invalidate_scope_cache` when they
    change the user's grants.
    """
    if user.is_superuser or _global_role_holds(user, perm) or _user_permission_holds(user, perm):
        return ALL

    from accounts.models import Grant, Organization

    cache = user.__dict__.setdefault("_scope_cache", {})
    if perm not in cache:
        roles = _roles_carrying_perm(perm)
        mine = Grant.objects.filter(principal_user=user, role__in=Subquery(roles), scope_org__isnull=False).values(
            "scope_org"
        )

        # Delegation: delegations whose principal org is one where the user acts
        # (member AND holds a direct Grant there carrying *this* permission's
        # role — permission-matched: the delegated role's bundle is the ceiling,
        # and a weak-role holder at B is not amplified to B's stronger delegated
        # roles at C).  Correlated EXISTS per delegation row, so there is no
        # org-list subquery to materialize and no DISTINCT to dedupe one.
        acts_at = Organization.objects.filter(
            users=user,
            grants__principal_user=user,
            grants__role__in=Subquery(roles),
            pk=OuterRef("principal_org_id"),
        )
        # Delegations only (org-principal), org-scope arm only — object grants
        # and user-principal grants never feed the org filter.
        inherited = Grant.objects.filter(
            Exists(acts_at),
            principal_org__isnull=False,
            role__in=Subquery(roles),
            scope_org__isnull=False,
        ).values("scope_org")

        cache[perm] = mine.union(inherited)
    return cache[perm]


def invalidate_scope_cache(user: "User") -> None:
    """Drop *user*'s memoized authority decisions (scopes + global tier + report).

    The memoized values live in ``user.__dict__`` — not model fields — so
    ``refresh_from_db()`` does not clear them; this is the only way to
    invalidate.  Authority write services (``grant_create`` / ``grant_delete``
    for a user principal) call this after changing *user*'s grants so a
    request that grants/revokes and then re-reads authority on the same user
    instance never serves the stale decision (a cached ``ALL`` sentinel is the
    hard-stale case).  The same request-scope staleness applies to the newer
    global-tier and effective-report memos (``global_permissions`` /
    ``organization_effective_permissions``) and the list-read holder
    memos (``_visible_client_rows_cache`` / ``_visible_task_rows_cache`` / ``_visible_note_rows_cache``),
    so they are dropped here too.
    Org→org delegation rows have no single user principal, and the selectors
    are consumed per request on fresh user instances, so those flows need no
    per-user invalidation here.
    """
    user.__dict__.pop("_scope_cache", None)
    user.__dict__.pop("_global_permissions", None)
    user.__dict__.pop("_org_effective_permissions", None)
    user.__dict__.pop("_visible_client_rows_cache", None)
    user.__dict__.pop("_visible_task_rows_cache", None)
    user.__dict__.pop("_visible_note_rows_cache", None)


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


def writable(qs: "QuerySet", user: "User", perm: str) -> "QuerySet":
    """The rows of *qs* on which *user* may exercise *perm* **for writes**.

    ``can_obj`` as a queryset filter (RFC 0002 §Precondition — write scope is
    chosen independently of read scope).  Mutation gates fetch through this
    instead of fetching unfiltered and checking ``can_obj`` afterwards: the
    fetch itself is the gate (a forbidden row is simply unfetchable), and one
    query does the work of two.  The org arm reuses :func:`visible` *with the
    write perm* — literally the predicate ``can_obj`` resolves for a row.

    Tiers (kept in lockstep with :func:`can_obj`, which delegates here):

    * **ORG** (org-anchored, ``org_via`` not ``None``) — ``visible(qs, …)``.
    * **SHARED** (``write_tier = WRITE_SHARED``) — all rows iff the user holds
      *perm* anywhere, none otherwise.
    * **Fail-closed default** — all rows only for the global tier (``scopes``
      is ALL); ``WRITE_OBJECT`` sits here until the object arm wires grants.
    """
    from common.models import OrgScoped, WRITE_SHARED

    model = qs.model
    if not issubclass(model, OrgScoped):
        return qs.none()
    if model.org_via is not None:
        return visible(qs, user, perm)
    if model.write_tier == WRITE_SHARED:
        return qs if can_anywhere(user, perm) else qs.none()
    return qs if scopes(user, perm) is ALL else qs.none()


def can(user: "User", perm: str, *, org: Any) -> bool:
    """Authority in an organization — the check for creates, which have no row yet."""
    from accounts.models import Grant

    s = scopes(user, perm)
    if s is ALL:
        return True
    return Grant.objects.filter(scope_org=org, scope_org__in=Subquery(s)).exists()


def can_obj(user: "User", perm: str, obj: "Model") -> bool:
    """The single-row write check — :func:`writable` applied to one row.

    Kept for callers that already hold a row (services, ``explain``); mutation
    gates should instead fetch *through* :func:`writable` so the fetch itself
    is the gate.  The write tiers live in :func:`writable`'s docstring
    (RFC 0002 §Precondition); this delegates so the two can never drift.
    """
    model = obj.__class__
    return writable(model._base_manager.all(), user, perm).filter(pk=obj.pk).exists()


def can_anywhere(user: "User", perm: str) -> bool:
    """Authority anywhere — the check for creates on platform-shared models."""
    s = scopes(user, perm)
    return s is ALL or s.exists()

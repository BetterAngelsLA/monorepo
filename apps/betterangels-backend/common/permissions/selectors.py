"""Read-side authorization selectors (ADR 0001 §2.4, §2.10).

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
from typing import TYPE_CHECKING, Any, Optional, cast

from django.db.models import Exists, OuterRef, Q, Subquery

if TYPE_CHECKING:
    from django.db.models import Model, QuerySet
    from organizations.models import Organization

    from accounts.models import User

ALL = object()
"""Sentinel for the global tier — row-invariant, so ``visible`` hoists it."""


def _perm_parts(perm: str) -> tuple[str, str]:
    app_label, codename = perm.split(".", 1)
    return app_label, codename


def _roles_carrying_perm(perm: str) -> "QuerySet":
    """Scoped ``Role`` ids that carry *perm* — the legacy matcher's role set.

    Kept for :mod:`common.permissions.explain`, which matches leftover legacy
    ``PermissionGroup`` rows against the roles that would carry the permission.
    Authority itself reads :func:`_authority`, not this.
    """
    app_label, codename = _perm_parts(perm)
    from accounts.models import Role

    return Role.objects.filter(
        is_global=False,
        permissions__content_type__app_label=app_label,
        permissions__codename=codename,
    ).values("pk")


_NO_ORGS: frozenset[int] = frozenset()
"""The finite-scope empty set — shared, so a non-holder allocates nothing."""


def _authority(user: "User") -> dict[str, Any]:
    """The request's authority snapshot: global perms + org scopes per permission.

    One pass over the user's grants, role permissions, memberships, and
    delegations instead of one query per ``(user, perm)``.  ``scopes`` is
    consulted once per row by per-field gates, so the per-permission form paid
    the same lookups for every distinct permission on the page.  This pays three
    queries for the whole request:

    * global-tier permissions — global Roles plus direct ``user_permissions``;
    * direct scoped Grants, expanded through their role's permissions;
    * org-principal delegations, kept only for a principal org the user is a
      member of and where they already hold the same permission directly
      (§2.4 permission-matched, one hop).

    Object grants are excluded (``scope_org`` NULL): they never register as an
    org scope.  Memoized on the user instance; :func:`invalidate_scope_cache`
    drops it with the other authority memos.
    """
    cache: Optional[dict[str, Any]] = user.__dict__.get("_authority_cache")
    if cache is not None:
        return cache

    from django.contrib.auth.models import Permission
    from organizations.models import Organization

    from accounts.models import Grant

    global_perms = set(
        Permission.objects.filter(Q(group__in=user.groups.filter(role__is_global=True)) | Q(user=user)).values_list(
            "content_type__app_label", "codename"
        )
    )

    orgs: dict[str, set[int]] = {}
    direct_orgs: dict[str, set[int]] = {}
    direct = Grant.objects.filter(
        principal_user=user,
        role__is_global=False,
        role__permissions__isnull=False,
        scope_org__isnull=False,
    ).values_list(
        "scope_org_id",
        "role__permissions__content_type__app_label",
        "role__permissions__codename",
    )
    for org_id, app_label, codename in direct:
        perm = f"{app_label}.{codename}"
        orgs.setdefault(perm, set()).add(org_id)
        direct_orgs.setdefault(perm, set()).add(org_id)

    delegated = Grant.objects.filter(
        Exists(Organization.objects.filter(users=user, pk=OuterRef("principal_org_id"))),
        role__is_global=False,
        role__permissions__isnull=False,
        principal_org__isnull=False,
        scope_org__isnull=False,
    ).values_list(
        "principal_org_id",
        "scope_org_id",
        "role__permissions__content_type__app_label",
        "role__permissions__codename",
    )
    for principal_id, scope_id, app_label, codename in delegated:
        perm = f"{app_label}.{codename}"
        if principal_id in direct_orgs.get(perm, ()):
            orgs.setdefault(perm, set()).add(scope_id)

    cache = {"global": global_perms, "orgs": {perm: frozenset(ids) for perm, ids in orgs.items()}}
    user.__dict__["_authority_cache"] = cache
    return cache


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

    Returns a ``frozenset`` of org ids (or :data:`ALL`), read from the
    request-cached :func:`_authority` snapshot — one traversal of the user's
    grants for every permission the request asks about.
    """
    if user.is_superuser:
        return ALL

    authority = _authority(user)
    if _perm_parts(perm) in authority["global"]:
        return ALL
    return authority["orgs"].get(perm, _NO_ORGS)


def invalidate_scope_cache(user: "User") -> None:
    """Drop *user*'s memoized authority decisions (the snapshot + report).

    The memoized values live in ``user.__dict__`` — not model fields — so
    ``refresh_from_db()`` does not clear them; this is the only way to
    invalidate.  Authority write services (``grant_create`` / ``grant_delete``
    for a user principal, and ``role_assign`` / ``role_remove`` for the global
    tier) call this after changing *user*'s authority so a request that
    grants/revokes and then re-reads authority on the same user instance never
    serves the stale decision (a cached ``ALL`` sentinel is the hard-stale
    case).  The same request-scope staleness applies to the effective-report memos
    (``global_permissions`` / ``organization_effective_permissions``), so they
    are dropped here too.  Org→org delegation rows have no single user
    principal, and the selectors are consumed per request on fresh user
    instances, so those flows need no per-user invalidation here.
    """
    user.__dict__.pop("_authority_cache", None)
    user.__dict__.pop("_can_anywhere_cache", None)
    user.__dict__.pop("_global_permissions", None)
    user.__dict__.pop("_org_effective_permissions", None)


def visible(qs: "QuerySet", user: "User", perm: str, *, in_org: int | str | None = None) -> "QuerySet":
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
        # platform-shared: perm held anywhere (finite s) ⇒ all rows.
        # `can_anywhere` is the memoized holder check, so a caller that just ran
        # the permission checker does not repeat it here.
        qs = qs if can_anywhere(user, perm) else qs.none()
    elif s:
        qs = qs.filter(reduce(or_, (Q(**{f"{p}__in": s}) for p in paths)))
    else:
        qs = qs.none()

    if in_org is not None and s is not ALL and paths:
        qs = qs.filter(reduce(or_, (Q(**{p: in_org}) for p in paths)))
    return qs


def can(user: "User", perm: str, *, org: Any) -> bool:
    """Authority in an organization — the check for creates, which have no row yet."""
    s = scopes(user, perm)
    if s is ALL:
        return True
    org_id = getattr(org, "pk", org)
    try:
        org_id = int(org_id)
    except TypeError, ValueError:
        return False
    return org_id in s


def can_obj(user: "User", perm: str, obj: "Model") -> bool:
    """The single-row write check — the row filter applied to one row.

    Write scope is chosen independently of read scope (RFC 0002 §Precondition):

    * **ORG** (derived default for an org-anchored model, ``org_via`` not
      ``None``) — the row must sit in an org the user can exercise *perm* in.
      Unchanged from the pre-tier contract.
    * **SHARED** (declared ``write_tier = WRITE_SHARED`` on a platform-shared
      model) — any holder of *perm* anywhere may act (``can_anywhere``).
      ``ClientProfile`` declares this to match ``main`` (RFC 0002 decision #1).
    * **Fail-closed default** for a platform-shared model with no declared tier
      (finding C1 / RFC 0002): the read rule never feeds an undeclared write —
      only the global tier (``scopes`` is ALL) may act, until an object grant
      covers the row once the object arm is wired at the clients cutover.
    """
    from common.models import WRITE_SHARED, OrgScoped

    model = obj.__class__
    if not issubclass(model, OrgScoped):
        return False
    if model.org_via is not None:
        # Own-org columns are read from the row; a hop reads just the org id
        # column from the database, because a cached parent can be stale after a
        # re-point and the object graph cannot prove it is current.
        s = scopes(user, perm)
        if s is ALL:
            return True
        if not s:
            return False
        paths = model.org_paths()
        if not any("__" in path for path in paths):
            # Own-org columns live on the row — no query, no stale relation.
            return any(getattr(obj, path, None) in s for path in paths)

        # A hop needs the parent row, and a cached relation can be stale after a
        # re-point (merge, ``queryset.update()``) or absent on a row built from
        # the FK id.  Read only the org id column(s): one cheap query, not the
        # full permission-filtered queryset the old check compiled per row.
        row = model._base_manager.filter(pk=obj.pk).values_list(*paths).first()
        if row is None:
            return False
        return any(value in s for value in row if value is not None)
    if model.write_tier == WRITE_SHARED:
        return can_anywhere(user, perm)
    s = scopes(user, perm)
    return s is ALL


def can_anywhere(user: "User", perm: str) -> bool:
    """Authority anywhere — the check for creates on platform-shared models.

    Memoized per request: :func:`scopes` caches the lazy queryset, but
    ``.exists()`` evaluates it, so an unmemoized predicate re-queries once per
    call site (every row of a list field, every nested type).  The boolean is
    what callers ask for, so cache that; :func:`invalidate_scope_cache` drops
    it with the other authority memos.
    """
    cache: dict[str, bool] = user.__dict__.setdefault("_can_anywhere_cache", {})
    if perm not in cache:
        s = scopes(user, perm)
        cache[perm] = s is ALL or bool(s)
    return cache[perm]


def can_globally(user: "User", perm: str) -> bool:
    """Whether *user* holds *perm* at the global tier — never through a Grant.

    The global arm of :func:`scopes`: superuser, a global Role carrying *perm*
    in ``user.groups``, or a direct ``user_permissions`` row.  Scoped Grant
    reach never satisfies this, so it is the check for gates that must stay
    global (e.g. the BA-only additional-contacts field).

    Sibling of :func:`can_anywhere`, which admits scoped Grant reach
    (``ALL`` or a non-empty scope set) — use this predicate only when scoped authority
    must never satisfy the gate.  The two diverge the moment a scoped Role
    carries *perm* and is granted.
    """
    return scopes(user, perm) is ALL

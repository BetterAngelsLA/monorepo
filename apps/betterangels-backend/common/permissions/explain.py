"""Grant-model explanation — why a user can or cannot do P at org O / on object R (ADR 0001).

The debugger the model was missing.  The verdict is always re-asked from the
canonical predicate — ``can`` at an org, ``can_obj`` on a row, ``can_anywhere``
with no scope — so an explanation can never disagree with enforcement; the arms
that fed it are then walked one by one:

* **global tier** — superuser / global Role / ``user_permissions``;
* **direct grant** — a user-principal ``Grant`` at the org;
* **delegated** — an org-principal delegation the user inherits (permission-matched);
* **object grant** — rows for the object arm (not wired until the clients cutover);
* **legacy rows** — ``PermissionGroup`` membership, with the domain's live/inert
  posture (``common.permissions.domain``).

Legacy-only domains (notes/clients) have not cut over: enforcement today rides
the legacy arm, and the verdict here is what the grant model would answer — the
difference between the two is exactly the cutover's remaining surface.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional

from common.permissions.domain import LEGACY_INERT_APPS

if TYPE_CHECKING:
    from django.db.models import Model

    from accounts.models import User
    from organizations.models import Organization

_MAX_SHOWN = 5
"""Names listed per arm before ``+N more`` — this is a terminal tool for humans."""


@dataclass(frozen=True)
class Arm:
    """One authority input and whether it carries the permission in this scope."""

    label: str
    holds: bool
    detail: str


@dataclass(frozen=True)
class Explanation:
    """The verdict (the canonical predicate's answer) and the arms behind it."""

    user: "User"
    perm: str
    mode: str
    cut_over: bool
    verdict: bool
    org: Optional["Organization"]
    obj: Optional["Model"]
    arms: tuple[Arm, ...]
    notes: tuple[str, ...]


def _split_perm(perm: str) -> tuple[str, str]:
    app_label, _, codename = perm.partition(".")
    if not app_label or not codename:
        raise ValueError(f"permission must be 'app_label.codename', got {perm!r}")
    return app_label, codename


def _grant_carries(app_label: str, codename: str) -> dict[str, str]:
    return {
        "role__permissions__content_type__app_label": app_label,
        "role__permissions__codename": codename,
    }


def _legacy_carries(app_label: str, codename: str) -> dict[str, str]:
    return {
        "permissions__content_type__app_label": app_label,
        "permissions__codename": codename,
    }


def _names(names: list[str]) -> str:
    shown = ", ".join(names[:_MAX_SHOWN])
    if len(names) > _MAX_SHOWN:
        shown += f", +{len(names) - _MAX_SHOWN} more"
    return shown


def _global_arm(user: "User", app_label: str, codename: str) -> Arm:
    superuser = bool(user.is_superuser)
    roles = sorted(
        user.groups.filter(
            role__is_global=True,
            role__permissions__content_type__app_label=app_label,
            role__permissions__codename=codename,
        )
        .values_list("name", flat=True)
        .distinct()
    )
    direct = user.user_permissions.filter(content_type__app_label=app_label, codename=codename).exists()
    detail = (
        f"superuser: {'yes' if superuser else 'no'}; "
        f"global roles: {_names(roles) if roles else 'none'}; "
        f"user_permissions: {'yes' if direct else 'no'}"
    )
    return Arm("global tier", superuser or bool(roles) or direct, detail)


def _direct_arm(user: "User", app_label: str, codename: str, *, org: Optional["Organization"]) -> Arm:
    from accounts.models import Grant

    base = Grant.objects.filter(principal_user=user, scope_org__isnull=False, **_grant_carries(app_label, codename))
    if org is not None:
        roles = sorted({g.role.name for g in base.filter(scope_org=org).select_related("role")})
        if roles:
            return Arm("direct grant", True, f"role(s) {', '.join(roles)} at org {org.pk}")
        held = sorted(
            {g.role.name for g in Grant.objects.filter(principal_user=user, scope_org=org).select_related("role")}
        )
        detail = "no grant at this org carries the permission"
        if held:
            detail += f" (held role(s) at org: {', '.join(held)})"
        return Arm("direct grant", False, detail)

    rows = list(base.select_related("role", "scope_org"))
    granted = sorted({f"{g.role.name} @ {g.scope_org.name}" for g in rows if g.scope_org is not None})
    detail = _names(granted) if granted else "no scoped grant carries the permission"
    return Arm("direct grant", bool(rows), detail)


def _acting_org_ids(user: "User", app_label: str, codename: str) -> set[int]:
    """Orgs where *user* is a member AND holds a direct grant carrying the permission.

    The "acts at B" rule ``scopes()`` requires before a delegation B→C is
    inheritable (permission-matched — no amplification).
    """
    from organizations.models import Organization

    return set(
        Organization.objects.filter(
            users=user,
            grants__principal_user=user,
            grants__role__permissions__content_type__app_label=app_label,
            grants__role__permissions__codename=codename,
        ).values_list("pk", flat=True)
    )


def _delegated_arm(user: "User", app_label: str, codename: str, *, org: Optional["Organization"]) -> Arm:
    from accounts.models import Grant

    acting = _acting_org_ids(user, app_label, codename)

    if org is not None:
        delegations = list(
            Grant.objects.filter(
                scope_org=org, principal_org__isnull=False, **_grant_carries(app_label, codename)
            ).select_related("role", "principal_org")
        )
        if not delegations:
            return Arm("delegated", False, "no org-principal delegations scope this org for this permission")
        matched = [d for d in delegations if d.principal_org_id in acting]
        if matched:
            delegators = sorted({d.principal_org.name for d in matched if d.principal_org is not None})
            return Arm(
                "delegated",
                True,
                f"inherited from {_names(delegators)} (the user acts there with this permission)",
            )
        delegators = sorted({d.principal_org.name for d in delegations if d.principal_org is not None})
        return Arm(
            "delegated",
            False,
            f"delegation(s) into this org exist ({_names(delegators)}) but the user does not act at the "
            "delegator with this permission",
        )

    inherited = list(
        Grant.objects.filter(
            principal_org__isnull=False, scope_org__isnull=False, **_grant_carries(app_label, codename)
        ).select_related("role", "principal_org", "scope_org")
    )
    matched = [d for d in inherited if d.principal_org_id in acting]
    if matched:
        orgs = sorted({d.scope_org.name for d in matched if d.scope_org is not None})
        return Arm("delegated", True, f"inherited (delegated) at: {_names(orgs)}")
    return Arm("delegated", False, "no org-principal delegations the user inherits carry this permission")


def _object_arm(user: "User", app_label: str, codename: str) -> Arm:
    from accounts.models import Grant
    from common.permissions.config import OBJECT_GRANT_WHITELIST

    rows = list(
        Grant.objects.filter(
            principal_user=user, scope_object_type__isnull=False, **_grant_carries(app_label, codename)
        ).select_related("role")
    )
    wired = bool(OBJECT_GRANT_WHITELIST)
    if rows and not wired:
        return Arm(
            "object grant",
            False,
            f"{len(rows)} object-scoped row(s) exist though the arm is not wired (permissions.E003 flags these)",
        )
    if rows:
        return Arm("object grant", True, f"{len(rows)} object grant(s)")
    detail = "no object grants"
    if not wired:
        detail += " — the arm is not wired yet (enabled with the clients cutover)"
    return Arm("object grant", False, detail)


def _legacy_arm(
    user: "User",
    perm: str,
    app_label: str,
    codename: str,
    *,
    org: Optional["Organization"],
    obj: Optional["Model"],
    cut_over: bool,
) -> Arm:
    from accounts.models import PermissionGroup

    qs = PermissionGroup.objects.filter(user=user, **_legacy_carries(app_label, codename))
    if org is not None:
        qs = qs.filter(organization=org)
    rows = list(qs.select_related("organization").distinct())

    posture = (
        "inert for this domain (grant-only — never consulted)"
        if cut_over
        else "live for this domain (the current authority — not cut over)"
    )
    if rows:
        labels = [f"{row.label} @ {row.organization.name}" for row in rows]
        detail = f"{_names(labels)} — {posture}"
    else:
        detail = f"no PermissionGroup rows carry this permission — {posture}"
    holds = bool(rows) and not cut_over
    if obj is not None and not cut_over:
        detail += f"; legacy object check user.has_perm(perm, obj): {user.has_perm(perm, obj)}"
    return Arm("legacy rows", holds, detail)


def _write_tier_note(obj: "Model") -> str:
    from common.models import OrgScoped, WRITE_OBJECT, WRITE_SHARED

    model = type(obj)
    if not issubclass(model, OrgScoped):
        return "write scope: the model does not declare OrgScoped — can_obj() fails closed (no one may write)"
    if model.org_via is not None:
        return "write scope ORG — the row must sit in an org the user holds this permission in (scopes())"
    tier = model.__dict__.get("write_tier")
    if tier == WRITE_SHARED:
        return "write scope SHARED — any holder of the permission may act (can_anywhere)"
    if tier == WRITE_OBJECT:
        return "write scope OBJECT — per-record object grants"
    return "write scope fail-closed — platform-shared model with no declared write tier: only the global tier may act"


def _notes(
    user: "User",
    perm: str,
    *,
    org: Optional["Organization"],
    obj: Optional["Model"],
    cut_over: bool,
    verdict: bool,
) -> list[str]:
    from accounts.models import PermissionGroup
    from common.permissions.selectors import ALL, scopes

    notes: list[str] = []
    if not cut_over:
        app_label = _split_perm(perm)[0]
        notes.append(
            f"domain {app_label!r} has not cut over — enforcement today rides the legacy arm; "
            "the verdict above is the grant model's (post-cutover) answer"
        )
    elif not verdict:
        app_label, codename = _split_perm(perm)
        if PermissionGroup.objects.filter(user=user, **_legacy_carries(app_label, codename)).exists():
            notes.append(
                "legacy PermissionGroup row(s) exist but are inert for this domain — grants are the only authority"
            )

    s = scopes(user, perm)
    if s is not ALL:
        other_ids = [pk for pk in s.values_list("scope_org", flat=True) if org is None or pk != org.pk]
        if other_ids:
            from organizations.models import Organization

            names = sorted(Organization.objects.filter(pk__in=other_ids).values_list("name", flat=True))
            notes.append(f"also holds this permission at {len(other_ids)} other org(s): {_names(names)}")

    if obj is not None:
        notes.append(_write_tier_note(obj))
    return notes


def explain(
    user: "User",
    perm: str,
    *,
    org: Optional["Organization"] = None,
    obj: Optional["Model"] = None,
) -> Explanation:
    """Explain *user*'s authority for *perm* — at *org*, on *obj*, or anywhere.

    Pass at most one of *org* / *obj*.  The verdict is the canonical predicate
    for the mode (``can`` / ``can_obj`` / ``can_anywhere``) — exactly what
    enforcement would decide; the arms and notes explain how it got there.
    """
    from common.permissions.selectors import can, can_anywhere, can_obj

    app_label, codename = _split_perm(perm)
    if org is not None and obj is not None:
        raise ValueError("pass at most one of org= / obj=")
    mode = "object" if obj is not None else "org" if org is not None else "anywhere"
    cut_over = app_label in LEGACY_INERT_APPS

    if obj is not None:
        verdict = can_obj(user, perm, obj)
    elif org is not None:
        verdict = can(user, perm, org=org)
    else:
        verdict = can_anywhere(user, perm)

    arms = (
        _global_arm(user, app_label, codename),
        _direct_arm(user, app_label, codename, org=org),
        _delegated_arm(user, app_label, codename, org=org),
        _object_arm(user, app_label, codename),
        _legacy_arm(user, perm, app_label, codename, org=org, obj=obj, cut_over=cut_over),
    )
    notes = _notes(user, perm, org=org, obj=obj, cut_over=cut_over, verdict=verdict)
    return Explanation(
        user=user,
        perm=perm,
        mode=mode,
        cut_over=cut_over,
        verdict=verdict,
        org=org,
        obj=obj,
        arms=arms,
        notes=tuple(notes),
    )

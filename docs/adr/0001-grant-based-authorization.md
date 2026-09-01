# ADR 0001 — Grant-based authorization

**Status:** Draft (open decisions in §7 pending)
**Date:** 2026-09-01
**Scope:** Backend authorization model. First cutover: shelters. Target: outreach app (notes, tasks, clients, referrals, teams, reports).
**Related:** [SDB-218], [PR #2407]

---

## 1. Context

The permission system today is built on `PermissionGroup`, an `auth.Group` subclass
unique on `(organization, template)`. It has one structural property everything else
follows from: **`auth.Group.permissions` is unconditionally global.** `ModelBackend`
unions `user.groups__permissions` with no notion of scope, so the moment a permission
is written onto an org's `PermissionGroup`, `has_perm` answers `True` everywhere and
row filters stop filtering. The consequences, all present in the codebase:

- Permissions had to be *withheld* from roles (`CASEWORKER` carries ADD/VIEW but not
  CHANGE/DELETE), pushing per-record CHANGE/DELETE onto guardian object rows written
  at creation.
- A parallel filter (`permissioned_queryset`) re-derives the answer from a
  `Organization → PermissionGroup → Permission` join and ignores the Django path —
  two answers to one question.
- `X-Organization-ID` appeared because the join needs an org id; first-match
  `resolve_permission_group` guesses it where the header isn't plumbed.
- Cross-org is structurally impossible and *global* is inexpressible:
  `PermissionGroup.organization` is non-null, so `GLOBAL_SHELTER_OPERATOR` is a
  126-permission template pinned to one arbitrary org, with `reconcile_org_groups`
  taught to skip it and a `bypasses_org_scoping` flag added in PR #2407 to make the
  join skip itself.

**Rejected alternative — PR #2407's `bypasses_org_scoping`.** It is an *exception to*
the scoping system, not a *tier within* it: implemented per check path
(`permissioned_queryset`, `HasOrgPerm`, resolver helper) with `get_user_permitted_org`
deliberately not honoring it; role-wide (all ~126 perms become cross-org together);
cannot express org→org delegation; and it is unreachable from the frontend
(`CurrentUserOrganizationType` is membership-derived, so a non-member global holder
gets an empty org list and every UI screen keys off `activeOrg`). Its one useful
artifact is the 541-line `test_global_shelter_operator.py`, which we keep as the
behavioral contract.

**Requirements (from the SDB-218 / outreach thread).** One model must handle: user
grants, global group grants, org grants (org→org "view/edit managed others"), object
grants, and cross-org grants; it must generalize to the outreach app with shelters as
the first isolated cutover; orgs must be able to allow other orgs to view/edit; client
sharing across orgs is a future requirement we must not block.

## 2. Decision

### 2.1 The rules

1. **Roles are organization-independent. Grants carry the organization.**
2. **The global tier has exactly one home:** a *global* role held directly in
   `user.groups`, read through Django's `has_perm`. Grant rows are always scoped.
3. **Authority never requires the `X-Organization-ID` header.** The header only
   *confines the view* (UI context) and only for users with finite scopes.
4. **Delegated authority is a grant row. Shared subject matter is a property of the
   data.** Never grant rows written at record-creation time.
5. **No denies, no transitivity.** The predicate is a pure union; one delegation hop,
   enforced structurally.

### 2.2 Data model

```python
# accounts/models.py
class Role(Group):
    """A named role. is_global=True: held directly in user.groups (global tier).
    is_global=False: granted via a Grant row, always scoped."""
    is_global = models.BooleanField(default=False)


@pghistory.track()  # audit: who granted what, when, to whom
class Grant(models.Model):
    """Who holds which role, where. The only scoped authorization input."""

    # ── principal: exactly one ──
    principal_user = models.ForeignKey(User, null=True, blank=True,
                                       on_delete=models.CASCADE, related_name="grants")
    principal_org = models.ForeignKey(Organization, null=True, blank=True,
                                      on_delete=models.CASCADE,
                                      related_name="delegated_grants")   # org→org delegation

    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="grants")

    # ── scope: exactly one ──
    scope_org = models.ForeignKey(Organization, null=True, blank=True,
                                  on_delete=models.CASCADE, related_name="grants")
    scope_object_type = models.ForeignKey(ContentType, null=True, blank=True,
                                          on_delete=models.CASCADE)
    scope_object_id = models.PositiveBigIntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            # exactly one principal
            models.CheckConstraint(condition=Q(principal_user__isnull=False) ^ Q(principal_org__isnull=False),
                                   name="grant_has_exactly_one_principal"),
            # exactly one scope (object needs both halves)
            models.CheckConstraint(
                condition=(Q(scope_org__isnull=False) & Q(scope_object_type__isnull=True)) |
                          (Q(scope_org__isnull=True) & Q(scope_object_type__isnull=False)
                           & Q(scope_object_id__isnull=False)),
                name="grant_has_exactly_one_scope"),
            # an org cannot delegate to itself
            models.CheckConstraint(condition=Q(principal_org__isnull=True) | ~Q(principal_org=F("scope_org")),
                                   name="grant_org_principal_is_not_scope"),
            # Partial + NULLS NOT DISTINCT: the user index only holds user-principal
            # rows and the org index only org-principal rows (a user grant's NULL
            # principal_org must not collide with another user's grant), while the
            # NULLS NOT DISTINCT scope columns still dedupe org- and object-scoped
            # rows within each principal kind.
            models.UniqueConstraint(fields=["principal_user", "role", "scope_org",
                                            "scope_object_type", "scope_object_id"],
                                    condition=Q(principal_user__isnull=False),
                                    nulls_distinct=False, name="unique_user_grant"),
            models.UniqueConstraint(fields=["principal_org", "role", "scope_org",
                                            "scope_object_type", "scope_object_id"],
                                    condition=Q(principal_org__isnull=False),
                                    nulls_distinct=False, name="unique_org_grant"),
        ]
```

#### Role definitions and provisioning

Roles are **code-owned** (like today's `TemplateConfig`) and synced to `Role` rows:

```python
# shelters/groups.py
class RoleDef:
    name: str
    permissions: tuple[str, ...]        # "app.codename"
    is_global: bool = False             # global ⇒ held in user.groups; scoped ⇒ via Grant
    is_invitable: bool = True
    invite_html: str | None = None
    welcome_html: str | None = None
    base_url_setting: str | None = None


SHELTER_OPERATOR = RoleDef(
    name="Shelter Operator",
    permissions=(Shelter.perms.ADD, ...),   # org-scoped shelter data only
    is_invitable=True,
)
GLOBAL_SHELTER_OPERATOR = RoleDef(
    name="Global Shelter Operator",
    permissions=(...),                      # shelter data + global reference data
    is_global=True,
    is_invitable=False,
)
```

A `sync_roles` command `get_or_create`s the `Role` rows and sets their permissions from
the `RoleDef`s (replacing `sync_group_permissions` for role-backed domains; legacy
templates keep their own sync during transition). `is_global` is **code-owned** — the
admin may not flip it (see E002). Invite/welcome email metadata lives on the `RoleDef`,
not on a per-org row.

### 2.3 Model declarations — one graph, not two

```python
class OrgScoped(models.Model):
    """Declares how a model reaches organizations.

    ``()``    my own ``organization`` FK
    ``(…)``   hop these relations (single-valued); a row is in scope for every org it reaches
    ``None``  platform-shared — no org scoping; see §2.4 ``visible()``
    """
    org_via: ClassVar[tuple[str, ...] | None] = ()

    class Meta:
        abstract = True
```

`org_paths()` resolves `org_via` recursively to lookup paths. **Object-grant ancestors
are derived from `org_via`** (the same relations, reversed) — a single declaration, so
the org filter and the object-grant cascade cannot drift (finding F18).

```python
class Shelter(OrgScoped, BaseModel):       ...              # owns organization
class Bed(OrgScoped, BaseModel):          org_via = ("shelter",)
class Room(OrgScoped, BaseModel):         org_via = ("shelter",)
class Reservation(OrgScoped, BaseModel):  org_via = ("bed", "room")
class ShelterPhoto(OrgScoped, BaseModel): org_via = ("shelter",)
# outreach (future cutovers):
class Note(OrgScoped, BaseModel):         org_via = ("organization",)
class Referral(OrgScoped, BaseModel):     org_via = ("organization", "shelter")
class ClientProfile(OrgScoped, BaseModel): org_via = None   # platform-shared by decision
```

**Reference-data note:** most of GSO's permissions are for *global reference data*
(City, SPA, RoomStyle, media, …) — data that is not org-scoped at all. Those permissions
belong on the global role because the **data is global**, not as a side effect of GSO.
A future role needing only org-scoped shelter data carries only the shelter-data perms
and is granted via `Grant`.

### 2.4 The predicate

```python
ALL = object()


def _global_role_holds(user, perm):
    return user.groups.filter(role__is_global=True, role__permissions__content_type__app_label=...,
                              role__permissions__codename=...).exists()


def scopes(user, perm):
    """``ALL``, or the org ids where *user* holds *perm* (direct or delegated)."""
    # global tier — read explicitly, NOT user.has_perm, until legacy PermissionGroups
    # (which pollute has_perm) are gone; collapses to has_perm at teardown.
    if user.is_superuser or _global_role_holds(user, perm) or user.user_permissions.filter(_perm(perm)).exists():
        return ALL

    roles = Role.objects.filter(is_global=False, permissions__codename=...,
                                permissions__content_type__app_label=...).values("pk")

    # direct user grants
    mine = Grant.objects.filter(principal_user=user, role__in=Subquery(roles)).values("scope_org")

    # delegation: org-principal grants inherited by the principal org's people.
    # "acts at B" = member of B AND holds any grant at B (with .distinct() — the join
    # multiplies rows). A consultant granted a role at B without membership does NOT
    # inherit B's delegations — no amplification (findings F1, F19 — reduced).
    at = Organization.objects.filter(users=user, grants__principal_user=user).values("pk").distinct()
    inherited = Grant.objects.filter(principal_org__in=Subquery(at), role__in=Subquery(roles)).values("scope_org")

    return mine.union(inherited)


def visible(qs, user, perm, *, in_org=None):
    """The rows of *qs* on which *user* may exercise *perm*."""
    paths = qs.model.org_paths()
    s = scopes(user, perm)

    if s is ALL:
        qs = qs                                     # global: unconfined
    elif paths is None:
        # platform-shared: perm held anywhere (finite s) ⇒ all rows (finding F14)
        qs = qs if s.exists() else qs.none()
    elif s:
        qs = qs.filter(reduce(or_, (Q(**{f"{p}__in": s}) for p in paths)))
    else:
        qs = qs.none()

    # object arm — schema-live, predicate-lazy: wired when per-record sharing has a
    # consumer (clients cutover). See §2.5.
    if OBJECT_ARM_ENABLED:
        qs = qs.filter(Q(pk__in=qs.values("pk")) | _object_grant_q(qs.model, user, perm))

    # header confines the view only for finite scopes (finding F13) —
    # a global holder is never org-confined by a stale header
    if in_org is not None and s is not ALL and paths:
        qs = qs.filter(reduce(or_, (Q(**{p: in_org}) for p in paths)))
    return qs


def can(user, perm, *, org):
    """Authority in an organization — the check for creates, which have no row yet."""
    s = scopes(user, perm)
    if s is ALL:
        return True
    # filter() is not allowed on a union queryset (finding F15) — wrap it
    return Grant.objects.filter(scope_org=org, scope_org__in=Subquery(s)).exists()


def can_obj(user, perm, obj):
    """The single-row check *is* the row filter, applied to one row."""
    return visible(obj.__class__._base_manager.filter(pk=obj.pk), user, perm).exists()


def can_anywhere(user, perm):
    """Authority for platform-shared creates — no org to check (finding F14)."""
    s = scopes(user, perm)
    return s is ALL or s.exists()
```

`scopes()` is memoized per request on the user instance (`user.__dict__["_scope_cache"]`),
mirroring `ModelBackend._perm_cache`. The cached value is the lazy union queryset, never
evaluated — so per-row `can_obj` and per-mutation `can()`/`can_anywhere()` cost one
subquery, not a re-derivation.

### 2.5 Object grants (schema now, wired at the clients cutover)

- `scope_object_type` is restricted by a **whitelist** that excludes `Organization`
  **and any org-bearing model** (findings F5, F16) — object-granting a row that has an
  org would create a second path to the same authority.
- A `post_delete` signal on every whitelisted model removes orphan grants (finding F3).
- Cascade to children is derived from `org_via` (§2.3): an object grant on `Shelter X`
  covers `Bed`/`Room`/`Reservation`/photos under X via their ancestor paths.
- **Creates under an object grant** resolve the parent object and check
  `can_obj(parent, child_ADD)` (finding F17) — ADD-on-child ≈ CHANGE-on-parent. This is
  a stated convention for every child-create service, not per-site.
- The arm is `OBJECT_ARM_ENABLED = False` until the clients cutover ships (finding F9);
  it is turned on with its first consumer, not before.

### 2.6 Mutation surface convention

| Operation | Rule |
|---|---|
| Load by id | `visible(qs, perm).get(pk=…)` → `DoesNotExist` → 404. Authority-only; no header. |
| List | `visible(qs, perm, in_org=active_org(info))`; header **optional** (absent ⇒ unconfined) |
| Create (org-scoped) | explicit `organization_id` input; `can(user, perm, org=target)` **and** `Organization.objects.filter(pk=target).exists()` → `ValidationError` (finding F7 — `can()` never implies existence) |
| Create (platform-shared model) | `can_anywhere(user, perm)` — no org to check (finding F14) |
| Child create under object grant | resolve parent; `can_obj(parent, child_ADD)` (finding F17) |
| Header | `active_org(info)` returns `None` when absent; nothing *requires* it |

**Role assignment rule:** which roles an org may grant is a service-layer validation
reading `OrganizationProfile.org_types` (preserving today's `REGISTRY` rule) — it never
creates rows. Global roles (`is_global=True`) are never granted through a `Grant`.

### 2.7 Invariants enforced by `manage.py check`

- **E001** – `user.groups` contains a `Role` with `is_global=False` (a scoped role went
  global — the "helpful fix" attack; finding F2).
- **E002** – a `Grant` references a `Role` with `is_global=True`.
- **E003** – object grant targets a non-whitelisted model (including any org-bearing
  model; findings F5, F16).
- **E004** – an `org_via` hop is multi-valued (duplicate-row bug class).
- **E005** – a *scoped* role grants a permission on a model that doesn't declare
  `OrgScoped` (global roles are exempt — their permissions are never org-confined;
  the check fires the moment a scoped role needs one of those models).

### 2.8 Requirements coverage

| Requirement | Mechanism | Status |
|---|---|---|
| User grants | `Grant(principal_user, role, scope_org)` | ✅ |
| Global group grants | global `Role` in `user.groups` | ✅ |
| Org grants (org→org view/edit) | `Grant(principal_org, role, scope_org)` + delegation arm | ✅ (granularity limits, §3) |
| Object grants | `Grant(…, scope_object_*)` + ancestor cascade | ✅ schema / ⚠️ wired at clients cutover |
| Cross-org grants | delegation + multi-scope rows | ✅ |
| Outreach app (notes/clients/…) | `org_via` on each model + §2.4 tiers | ⚠️ notes §5, clients §5.1 |
| Shelter-first isolation | phased cutover, §4 | ✅ |
| Client sharing (future) | data edge feeding `org_paths()`; object arm for per-record | ⚠️ shape under-designed, §7.4 |

## 3. Accepted limitations (decided, not deferred)

- **Delegation is all-or-nothing per "member-with-any-grant" at the principal org, and
  has no role mapping** ("B's Shelter Operators become A's *Viewers*" is inexpressible)
  (finding F19). One row per role, no role translation, no individual carve-out without
  a deny rule (banned). Revisit at the outreach cutover.
- **One delegation hop.** Transitive delegation needs a recursive CTE; deferred until a
  real need exists.
- **Global roles are granted in the Django admin only.** Grant-admin parity for global
  grants is a log of `Role` membership changes, not a second representation.
- **No deny rules, ever.** Narrower permissions compose; denials break the union.

## 4. Migration plan

| Phase | Ships |
|---|---|
| **0** | This ADR; resolve §7 open decisions |
| **1** | `Role` + `Grant` models, constraints, checks, provisioning + backfill. **The backfill converts only shelter roles** — every other domain's `PermissionGroups` are untouched until their cutover. **Nothing reads it.** Provisioning (`sync_roles`) and backfill (`backfill_shelter_grants` / `backfill_global_role_members`) are idempotent `post_migrate` syncs + a `manage.py sync_roles` command, per the repo's "replaces RunPython data migrations" convention — not RunPython migrations. |
| **2** | `scopes()`/`visible()`/`can()` wired to **shelter** selectors/mutations (global + user + delegation arms); mutation-surface convention; org→org delegation admin inline; assign/invite service dual-writes `Grant` (authoritative for shelters) + legacy `PermissionGroup` (authoritative for everything else) with a `reconcile` command + test. **Covers org creation and owner-role seeding** (finding F22) — new orgs born during transition get `Grant`s for shelter roles, not legacy groups. |
| **3** | Frontend (both apps): grants-based org list (+ all orgs for global holders), header optional, `currentUser.permissions` global list as the shared contract (finding F24). |
| **4** | Clients/notes cutover: wire the object arm + whitelist + cleanup signals; client-sharing data edge; **notes/guardian migration per §5 / clients per §5.1**; guardian teardown per domain. |
| **5** | Teardown: delete legacy `PermissionGroup` for migrated domains, collapse the global-tier helper to `user.has_perm`, remove the dual-write branch. |

## 5. Notes / guardian migration (phase-4 design, finding F23)

Today, caseworkers hold ADD/VIEW on the template and CHANGE/DELETE comes from
per-note guardian rows written at creation — *"the creating org may edit this note."*
Moving CHANGE/DELETE onto the `Caseworker` role changes the semantic to "every
caseworker at the org edits every note in the org's scope," which **over-permits on
notes shared into an org's scope** (e.g. via referrals) that the org should only view.

This migration is therefore **not mechanical.** Design to be completed before phase 4:

- Org-owned notes: CHANGE/DELETE on the role, org-scoped (the common case).
- Shared/foreign notes: per-record control via the **object arm** (a sharing grant on
  the note) rather than guardian rows; the receiving org's *view* comes from
  `org_via`/sharing, its *edit* only from an explicit object grant.
- `assign_object_permissions` and guardian tables are deleted only after the
  equivalence is proven by tests (the 541-line GSO suite is the contract, extended
  with shared-note cases).

### 5.1 Client writes — open before phase 4

`ClientProfile` has **no organization FK** (no `clients/` migration ever added one), yet
the product rule is "reads are platform-shared, writes stay org-owned." Today org-owned
CHANGE/DELETE is enforced by guardian per-record rows tied to the creating org's group;
under v2 with `org_via = None`, org-scoped writes are inexpressible — `scopes()` returns
org ids and the client has no org.

Options to design before phase 4 (same class of problem as §5, worse because there is no
org to anchor to):

1. Add `ClientProfile.created_by_org` FK (backfill from guardian rows at cutover);
   CHANGE/DELETE on the `Caseworker` role, org-scoped via that org. Shared edits use the
   object arm.
2. Per-record object grants for CHANGE (no new column; ownership lives in the grant).

Cross-org edit/delete of profiles is an open product follow-up
(`docs/teams_org_scoping.md`); the model must make it expressible, not decide it.

## 6. References

- [SDB-218] — global shelter operator org-bypass ticket
- [PR #2407] — `feat/SDB-218/global-shelter-operator-org-bypass` (rejected direction;
  its test suite is retained as the behavioral contract)
- vecchp's design critique comments on [PR #2407] (Grant model, resolver, migration)
- `docs/teams_org_scoping.md` — product decision that cross-org *reads* (clients,
  notes/tasks) are deliberate and platform-shared

## 7. Open decisions (phase-0 gate)

1. **Admin-created custom roles** (finding F21): v1 default is **code-owned `RoleDef`s
   only**; admins may not create bespoke roles. Revisit if the admin-defined-template
   capability is product-required. If allowed later, `is_global` ownership, sync, and
   E002 need explicit rules.
2. **`Shelter.organization` nullability** — currently `SET_NULL`; orphans are reachable
   only at the global tier. Decide required-with-backfill vs. accept.
3. **Who administers org→org delegation** — org admin self-service in the portal vs.
   BA staff in Django admin. Decides whether phase 2 ships a UI or only an inline.
4. **Client-sharing data edge shape** — model, who adds/removes, implied perms
   (VIEW only?), audit. Under-designed by intent; must be specified before phase 4.
5. **`in_org` for scoped multi-org users** — confirmed: header picks the active view;
   authority is unaffected. No further decision needed.
6. **Client-writes design (§5.1)** — ownership model for platform-shared models with no
   org (`created_by_org` vs. per-record object grants). Required before phase 4.

[SDB-218]: https://betterangels.atlassian.net/browse/SDB-218
[PR #2407]: https://github.com/BetterAngelsLA/monorepo/pull/2407

# ADR 0001 — Grant-based authorization

**Status:** Design record for the grant migration (stack #2409 → #2435, merging
bottom-up). §2.4–§2.6 record the design as built across the stack; §2.9 and §5–§7
are the target end-state. §7 lists decisions (most resolved; #2 open).
**Date:** 2026-09-01 (revised 2026-09-02)
**Scope:** Backend authorization model. First cutover: shelters. Target: outreach app (notes, tasks, clients, referrals, teams, reports).
**Related:** [SDB-218], [PR #2407]

> **Reading guide.** §2 is the mechanics (model + predicate). If you want to *see
> how it works before reading the formal rules*, jump to **§2.9 — worked examples**
> (roles, grants, delegations, object grants resolved for concrete people and orgs).
> RFC 0002 / RFC 0003 are the per-domain cutover decisions this ADR gates.
> `finding F*` / `audit C-*` IDs reference the internal design audit; each is explained
> where it appears.

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

> **How to read §2.** §2.2–2.3 (models, `OrgScoped`) are **built in this PR (#2409)**.
> §2.4 (the predicate) is **design** — the code ships with the selectors (#2411) and
> evolves through #2416. §2.5–2.6 (object arm, mutation conventions) are **designed
> now, wired at each domain's cutover**. §2.9 is the **target end-state** the stack
> converges on; §5–§7 are forward design and decisions. Where a passage differs from
> what `main` does today, it says so explicitly.

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
6. **A `Role` row enters `user.groups` only through `role_assign`, and only for
   `is_global=True`.** Scoped roles are exercised exclusively through `Grant` rows —
   never group membership (E001). `Role` is a `Group` subclass, so the one structural
   hazard of the legacy model (`auth.Group.permissions` is unconditionally global) is
   held off by convention + checks rather than shape; this rule names the only legal
   write path.

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
            # NULLS NOT DISTINCT: two org-scoped (NULL object) or two object-scoped
            # (NULL scope_org) rows for one principal/role/scope are duplicates,
            # while an org-scoped and an object-scoped row still differ (one side
            # is NULL, the other is not).
            models.UniqueConstraint(fields=["principal_user", "role", "scope_org",
                                            "scope_object_type", "scope_object_id"],
                                    nulls_distinct=False, name="unique_user_grant"),
            models.UniqueConstraint(fields=["principal_org", "role", "scope_org",
                                            "scope_object_type", "scope_object_id"],
                                    nulls_distinct=False, name="unique_org_grant"),
        ]
```

**How to read a `Grant` row.** A grant always reads as *"<principal> holds <role>
**at** <scope>"* — the scope is where the authority is exercised and whose data it
reaches. The `principal_org` form is the one people misread: it is **not** "B grants R
to C"; it is the delegation **B receives to act at C** (its members who already hold R
at B may act at C — role-keyed, §3).

| Row | Data owner | People who gain authority | Read it as |
|---|---|---|---|
| `principal_user=Alice, role=R, scope_org=A` | A | Alice | Alice holds R **at A** |
| `principal_org=B, role=R, scope_org=C` | **C** | B's acting people | **C** lets **B**'s operators hold R **at C** |

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

**Global roles compose and may be narrower than full CRUD.** Authority at the global
tier is the per-permission union of every global `Role` a user holds in `user.groups`
(E001 keeps scoped roles out of groups; nothing forces a global role to be
all-or-nothing). A read-only global role — e.g. a "Global Shelter Viewer" carrying only
the `VIEW` perms of the shelter models — reads everything and edits nothing: `scopes`
returns `ALL` only for the perms the role actually carries, so `can`/`can_obj` for the
write perms fail closed, and `currentUser.permissions` surfaces only the held perms to
the frontend. One user may hold both a read-only global role and an org-scoped operator
role; each check resolves through the union.

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
# outreach (future cutovers) — these declare org_via = () because each owns its
# own ``organization`` FK; ``org_via`` hops *from* a model that lacks one:
class Note(OrgScoped, BaseModel):         org_via = ()          # owns organization
class Referral(OrgScoped, BaseModel):     org_via = ()          # owns organization (see §4.1 for the shelter-OR gap)
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
    # "acts at B" = member of B AND holds a direct grant at B whose role carries
    # this permission (role-keyed: no amplification to stronger delegated roles);
    # a consultant granted a role at B without membership does NOT inherit B's
    # delegations (findings F1, F19 — reduced).
    at = Organization.objects.filter(users=user, grants__principal_user=user,
                                     grants__role__in=Subquery(roles)).values("pk").distinct()
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
    """The single-row check *is* the row filter, applied to one row.

    Org-scoped model — the row falls in the user's scopes.  Platform-shared
    model (``org_via = None``) — per-record authority comes from the object
    arm or the global tier, never from "holds the perm anywhere" (finding
    C1): the read rule must not leak into per-record writes.
    """
    s = scopes(user, perm)
    if s is ALL:
        return True
    if not obj.__class__.org_paths():
        # platform-shared: only an object grant on this row grants per-record
        # authority (fails closed for non-whitelisted models)
        return obj.__class__._base_manager.filter(pk=obj.pk).filter(
            _object_grant_q(obj.__class__, user, perm)
        ).exists()
    return visible(obj.__class__._base_manager.filter(pk=obj.pk), user, perm).exists()
```

**Platform-shared per-record writes (finding C1).** `visible()`'s platform-shared
branch — "perm held anywhere ⇒ all rows" — is the **read** rule (reads are
deliberately platform-shared). It must never be the per-record **write** authority:
`can_obj` on a platform-shared model checks the object arm (or the global tier) and
fails closed otherwise. Write services on platform-shared models load records via
`can_obj` (or the object arm) for mutation, and only use `visible()` for reads and
load-by-id-for-display.

RFC 0002 reframes C1 as the **default** for a platform-shared model with **no declared
write tier** — declaring a SHARED write tier for a specific model is an explicit,
reviewed exception (`docs/adr/0002-client-writes-ownership.md`). The read rule never
feeds an undeclared write.

```python
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
- **Object grants are user-principal only (decision).** Sharing is person-granular:
  `Grant(principal_user, role, scope_object)` — authority attaches to a person you can
  audit and revoke. Org-principal object grants (`principal_org` + `scope_object`) are
  schema-legal but read by no predicate path, and wiring them would make authority
  org-granular — "every current *and future* member of org B with this role edits this
  record" — which is group-held per-record authority, the exact guardian shape this
  ADR deletes (rule 4). They are therefore **forbidden**: a new E00x check plus an
  admin form restriction (`scope_object` requires `principal_user`). If org-level
  per-record sharing is ever product-real, it belongs on the *data edge* (ADR §7.4 — a
  sharing relationship naming the orgs allowed to act), with authority still resolving
  per-person through each member's own role — never an org-principal `Grant`.
  Person-grant lifecycle on org departure: see RFC 0002 (granting-org provenance +
  revoke-on-exit).

### 2.6 Mutation surface convention

| Operation | Rule |
|---|---|
| Load by id | `visible(qs, perm).get(pk=…)` → `DoesNotExist` → 404. Authority-only; no header. |
| List | `visible(qs, perm, in_org=active_org(info))`; header **optional** (absent ⇒ unconfined) |
| Create (org-scoped) | explicit `organization_id` input; `can(user, perm, org=target)` **and** `Organization.objects.filter(pk=target).exists()` → `ValidationError` (finding F7 — `can()` never implies existence) |
| Create (platform-shared model) | `can_anywhere(user, perm)` — no org to check (finding F14) |
| Child create under object grant | resolve parent; `can_obj(parent, child_ADD)` (finding F17) |
| Update / Delete (org-scoped) | load the row via `visible(qs, perm).get(pk=…)` or `can_obj(user, perm, row)` — the org filter *is* the write check; never broaden to the read rule |
| Update / Delete (platform-shared) | the **write tier** decides (RFC 0002 § Precondition): `OBJECT` / undeclared → `can_obj` (fails closed, finding C1); `SHARED` (e.g. `ClientProfile`) → any holder of the perm anywhere may mutate (`can_anywhere`-equivalent) |
| Header | `active_org(info)` returns `None` when absent; nothing *requires* it |

**Write authority is the union of the user's full grant set, not the active org.**
The `X-Organization-ID` header confines *list* views (`visible(…, in_org=…)`) only;
single-row writes (`can`/`can_obj`) resolve against every org in `scopes()`. A user
holding a role at orgs A and B may edit org A's rows while the UI says they are acting
as B. This matches `main` (authority is identity-wide) and is deliberate — but it is a
stated product fact so nobody later "fixes" it by confining writes to the header.

**Contextual reads (nested platform-shared records).** A client (platform-shared)
shown *because its parent is visible* — e.g. a client on a reservation you can see — is
authorized by the **parent's scope**, not by holding the platform-wide client perm. A
shelter operator sees guests at their shelter through the reservation, not through a
global client browser. Read paths that surface a platform-shared record nested under a
visible org-scoped parent gate on the parent's visibility and never require (or imply)
the platform-wide model perm (RFC 0002 — client read-surface decision).

**Role assignment rule:** which roles an org may grant is a service-layer validation
reading `OrganizationProfile.org_types` (preserving today's `REGISTRY` rule) — it never
creates rows. Global roles (`is_global=True`) are never granted through a `Grant`.

The mechanics in §2.4–§2.6 are traced concretely for real people and orgs in
**§2.9 — worked examples** (roles, grants, delegation, object grants).

### 2.7 Invariants enforced by `manage.py check`

- **E001** – `user.groups` contains a `Role` with `is_global=False` (a scoped role went
  global — the "helpful fix" attack; finding F2).
- **E002** – a `Grant` references a `Role` with `is_global=True`.
- **E003** – object grant targets a non-whitelisted model (including any org-bearing
  model; findings F5, F16).
- **E004** – an `org_via` hop is multi-valued (duplicate-row bug class).
- **E005** – a permission is granted to a model that doesn't declare `OrgScoped`.

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

### 2.9 Worked examples — how roles, grants, and delegation compose

This section resolves the model for concrete people and orgs. It is the **target
end-state** (what the cutover PRs build); where `main` still behaves differently,
the example says so. Four parts, one map:

| Part | What it is | Where it lives | Example in §2.2 |
|---|---|---|---|
| `RoleDef` | code declaration: a named role + its permissions (`app.codename`) | `shelters/groups.py`, `accounts/groups.py` | `SHELTER_OPERATOR_ROLE` |
| `Role` | the `RoleDef` materialized as a DB row by `sync_roles` | `accounts.Role` | row "Shelter Operator", `is_global=False` |
| `Grant` | the **only** scoped authority row: *who holds which role where* | `accounts.Grant` | `(alice, Shelter Operator, Harbor)` |
| global tier | a global `Role` held directly in `user.groups` (never a `Grant`) | `user.groups` | `GLOBAL_SHELTER_OPERATOR_ROLE` |

Three rules make every trace below predictable:

1. **Authority is a union** — per permission, the global tier (if held) plus every
   `Grant` scope the user reaches. No denies, no subtraction.
2. **`scopes(user, perm)` is the whole answer** — `ALL` (global tier) or the org ids
   from direct grants + one-hop delegations. Reads filter rows by it; creates check
   the org in it; single-row writes check the row against it (`can_obj`).
3. **Writes never fall back to the read rule** — a row you can *read* (shared) is not
   a row you can *write*; per-record writes go through `can_obj` (or the object arm).

#### Example 1 — Shelter Operator inside one org (scoped role + grant)

The RoleDef (abridged; full list in §2.2):

```python
SHELTER_OPERATOR_ROLE = RoleDef(
    name="Shelter Operator",
    is_global=False,
    permissions=("shelters.add_shelter", "shelters.change_shelter",
                 "shelters.delete_shelter", "shelters.view_shelter",
                 "shelters.add_bed", "shelters.change_bed", ...),
)
```

Provisioning + assignment produce exactly two relevant rows:

| Row | principal | role | scope |
|---|---|---|---|
| `Role` | — | "Shelter Operator" (`is_global=False`) | — |
| `Grant` | `alice` | Shelter Operator | org `Harbor` |

Resolution for `alice` (perm = `shelters.change_bed`):

- `scopes(alice, change_bed)` = `{Harbor}` (her only grant). Not `ALL` — no global role.
- **List** shelters/beds: `visible(...)` returns rows whose org (via `org_via`) ∈
  `{Harbor}` — she sees Harbor's rows only; no other org is visible at all.
- **Create** a shelter: `can(alice, add_shelter, org=Harbor)` → `Harbor ∈ scopes` →
  allowed; the new row's `organization = Harbor`. Creating "in" another org fails.
- **Edit** a Harbor bed: `can_obj(alice, change_bed, bed)` → the bed's org resolves
  to Harbor via `org_via` → allowed.
- **Edit** a Sunrise (other org) shelter: `Sunrise ∉ {Harbor}` → invisible for reads,
  `can_obj` denied.

Add a second grant and the picture extends: `Grant(alice, Shelter Operator, Sunrise)`
→ `scopes = {Harbor, Sunrise}` → she operates both orgs and nothing else.

#### Example 2 — Global Shelter Operator, and a *read-only* global viewer

```python
GLOBAL_SHELTER_OPERATOR_ROLE = RoleDef(
    name="Global Shelter Operator", is_global=True,
    permissions=("...shelter CRUD + global reference data..."),
)
GLOBAL_SHELTER_VIEWER_ROLE = RoleDef(  # reads everything, edits nothing
    name="Global Shelter Viewer", is_global=True,
    permissions=("shelters.view_shelter", "shelters.view_bed", ...),
)
```

- **GSO (`carol`)** — `sync_roles` puts the global Role in `carol.user.groups`; there
  is **no `Grant` row**. `scopes(carol, shelter_perm)` = `ALL` → every shelter in
  every org, plus global reference data; `visible` unconfined; `can`/`can_obj` true.
- **Global Viewer (`dave`)** — `scopes(dave, view_shelter)` = `ALL` (he can list every
  shelter), but `scopes(dave, change_shelter)` is empty (no global role holds it, no
  grants) → `can`/`can_obj` for writes are false. Dave browses all shelters, edits none.
- **Combination** — `alice` from Example 1 *plus* the Global Viewer role: she reads all
  shelters (viewer) and edits only Harbor/Sunrise (operator grants). Global roles
  compose per permission; the FE gates on `currentUser.permissions`, which carries
  exactly what she holds (viewer perms globally, operator perms per org).

#### Example 3 — Caseworkers in two orgs: read everyone's notes, write your own org's

```python
CASEWORKER_ROLE = RoleDef(
    name="Caseworker", is_global=False,
    permissions=("notes.add_note", "notes.view_note",
                 "notes.change_note", "notes.delete_note", ...),  # Option A: CHANGE/DELETE on the role
)
```

Rows: `Grant(alice, Caseworker, orgA)` and `Grant(bob, Caseworker, orgB)`. Every
`Note` carries `organization` = the org that created it (org A's notes have
`organization = orgA`). **Read tier is SHARED; write tier is the row's org**
(RFC 0002 vocabulary — for notes the two coincide because org is set at creation).

| Operation | alice (org A) | bob (org B) |
|---|---|---|
| Read any note (A's or B's) | ✅ SHARED read: holds `view_note` anywhere → all rows | ✅ same |
| Create in own org | ✅ `can(add_note, orgA)` → note `organization = orgA` | ✅ `can(add_note, orgB)` |
| Edit own org's note | ✅ `can_obj(change_note, n)` → `n.organization = orgA ∈ {orgA}` | ✅ `n.organization = orgB ∈ {orgB}` |
| Edit the other org's note | ❌ `n.organization = orgB ∉ {orgA}` | ❌ `n.organization = orgA ∉ {orgB}` |

So org B's caseworkers can read org A's notes but **never edit them** — no special
cross-org rule; it falls out of `can_obj` filtering on the note's own org. If org B
legitimately needs to edit *one* org-A note, BA creates an explicit object grant
(Example 5). Today on `main` the same behavior is expressed with guardian rows at
creation instead of `Role` + `Grant` + `can_obj`; this example is the RFC 0003 cutover
(and needs RFC 0002's read/write-tier decoupling to make SHARED-read-on-an-org-owning
model a first-class cell).

#### Example 4 — Org→org delegation (one hop, role-keyed)

Central BA (`orgA`) is lent the "Shelter Viewer" role *at* the Sunrise Network
(`orgC`) so its staff can view Sunrise's shelters. Two rows do all the work:

| Row | principal | role | scope |
|---|---|---|---|
| `Grant` | org `CentralBA` (as principal) | Shelter Viewer | org `Sunrise` |
| `Grant` | `alice` | Shelter Viewer | org `CentralBA` |

Resolution for `alice` (`perm = view_shelter`):

- direct: grants where *she* holds the role → `{CentralBA}`;
- "acts at": orgs where she is a **member** *and* holds a grant whose role carries
  `view_shelter` → `{CentralBA}` (membership alone is not enough — no amplification);
- inherited: org-principal grants whose principal org ∈ `{CentralBA}` → `{Sunrise}`.
- `scopes = {CentralBA, Sunrise}` → alice lists Sunrise's shelters.

Role-keyed limits (deliberate): `evelyn`, a CentralBA member holding only "Shelter
Operator" (a *different* role) at CentralBA, does **not** inherit the delegated viewer
role at Sunrise; a consultant granted Viewer at CentralBA without membership does not
inherit either. There is no role *translation* (Sunrise cannot remap "Shelter Viewer"
into "Shelter Operator" for CentralBA's people), and Sunrise's own delegations onward
are not inherited (one hop).

#### Example 5 — Object grant (per-record sharing on a platform-shared model)

`ClientProfile` is platform-shared (`org_via = None`). Any caseworker reads all
clients (SHARED read); **writes fail closed per record** unless the global tier or an
object grant covers the row. BA shares client `c1` with `bob`:

| Row | principal | role | scope |
|---|---|---|---|
| `Grant` | `bob` | Caseworker (scoped role carrying `clients.change_clientprofile`) | **object** `c1` |

- `can_obj(bob, change_clientprofile, c1)` → object arm → **allowed**.
- `can_obj(bob, change_clientprofile, c2)` → no object grant on `c2` → **denied**
  (he can still *read* every client).

Object grants are user-principal only (§2.5 — org-principal object grants are
forbidden); the whitelist gates which models can carry them (`ClientProfile` today,
`Note` joins at its cutover); and what happens to them when `bob` leaves the org is
resolved in RFC 0002 (granting-org provenance + revoke-on-exit).

## 3. Accepted limitations (decided, not deferred)

- **Delegation inheritance is role-keyed, but there is no role *translation*.** A member
  of the principal org inherits its delegation at the target org only for a permission
  whose role they also hold at the principal org — a member holding only a weaker role
  is not amplified to the delegated role (no amplification; audit C-1). What remains
  inexpressible is mapping the delegated role onto a *different* role at the target
  ("B's Shelter Operators become A's *Viewers*") (finding F19). One row per role, no
  role translation, no individual carve-out without a deny rule (banned). Revisit at
  the outreach cutover.
- **One delegation hop.** Transitive delegation needs a recursive CTE; deferred until a
  real need exists.
- **Global roles are granted in the Django admin only.** Grant-admin parity for global
  grants is a log of `Role` membership changes, not a second representation.
- **No deny rules, ever.** Narrower permissions compose; denials break the union.
- **No row-attribute conditions.** Granularity stops at scope tier + per-record object
  grant. "Only rows assigned to me", "only rows I created within the org" (`CREATOR`
  is org-level, not user-level), and client-relative reads ("org B sees only notes on
  clients it co-serves") are inexpressible today — they are a future *condition* axis,
  not schema debt now (RFC 0002 parks the read side; RFC 0003 the task side).

## 4. Migration plan

| Phase | Ships |
|---|---|
| **0** | This ADR; resolve §7 open decisions |
| **1** | `Role` + `Grant` models, constraints, checks, provisioning (sync creates the roles once; per-org `PermissionGroup` materialization stops for shelter roles), backfill (GSO → global Role; Shelter Operator memberships → `Grant` rows). **The backfill converts only shelter roles** — every other domain's `PermissionGroups` are untouched until their cutover. **Nothing reads it.** |
| **2** | `scopes()`/`visible()`/`can()` wired to **shelter** selectors/mutations (global + user + delegation arms); mutation-surface convention; org→org delegation admin inline; assign/invite service dual-writes `Grant` (authoritative for shelters) + legacy `PermissionGroup` (authoritative for everything else) with a `reconcile` command + test. **Covers org creation and owner-role seeding** (finding F22) — new orgs born during transition get `Grant`s for shelter roles, not legacy groups. |
| **3** | Frontend (both apps): grants-based org list (+ all orgs for global holders), header optional, `currentUser.permissions` global list as the shared contract (finding F24). |
| **4** | Clients/notes cutover: wire the object arm + whitelist + cleanup signals; client-sharing data edge; **notes/guardian migration per §5 / clients per §5.1**; guardian teardown per domain. |
| **5** | Teardown: delete legacy `PermissionGroup` for migrated domains, collapse the global-tier helper to `user.has_perm`, remove the dual-write branch. |

### 4.1 Remaining domains — readiness matrix (the full-migration target)

Every org-scoped domain ends on the grant model; platform-shared data uses the object
arm + an ownership anchor; reference data stays on the global tier. What each domain
still needs at its cutover:

| Domain | Model path | `org_via` at cutover | Current authority | Migration shape | Gate |
|---|---|---|---|---|---|
| **Tasks** | `Task.organization` | `()` | legacy template + guardian rows at creation | §5-equivalence: org-scoped writes on the role; shared/foreign rows via the object arm | **Not mechanical** — guardian-at-creation (§5) |
| **Referrals** | `Referral.organization` (+ shelter) | `()` — but "own org **or** via shelter" is inexpressible today (§4.1 note) | legacy + guardian rows at creation | §5-equivalence: org-scoped writes on the role; shared/foreign rows via the object arm | **Not mechanical** — guardian-at-creation (§5) |
| **Teams** | `Team.organization` | `()` | legacy `ORG_ADMIN`/`ORG_SUPERUSER` template — no scoped `Role` row yet | **Cut over (§5.3)** — no guardian rows; org reads/writes via `can()`/`can_obj` on the role-backed admin roles | None (after §5.3) |
| **Reports** | report row `.organization` | `()` | legacy `ORG_ADMIN`/`ORG_SUPERUSER` template — no scoped `Role` row yet | **Cut over (§5.3)** — DRF + GraphQL reads authorize through the grant predicate | None (after §5.3) |
| **Notes** | `Note.organization` | `()` | legacy template + guardian rows at creation | org-owned writes on the role; shared/foreign notes via the object arm | **Not mechanical** — §5 design |
| **Clients** | `ClientProfile` (no org FK) | `None` (platform-shared) | legacy model-level perms on CASEWORKER (no per-record rows) | parity-first: SHARED write via `can_anywhere` (RFC 0002); owner-tier (`created_by_org`) parked | §5.1 / RFC 0002 |
| **HMIS** | `HmisProfile` → `ClientProfile` | `None` (platform-shared) | legacy `resolve_permission_group` | rides the clients cutover | rides clients |
| **Reference data** (City, SPA, lookups, media) | global data, no org | n/a | legacy GSO `PermissionGroup` template (global tier) | stays on the global tier — never org-scoped | None — by design |

> **`org_via` cells are `()` for every org-owning domain.** A model with its own
> `organization` FK declares `org_via = ()`; the `("organization",)` form hops
> *through* a relation to a model that owns one and would raise `TypeError` at import
> (`hop 'organization' targets Organization, which does not declare OrgScoped`) — the
> earlier matrix and §2.3 examples were wrong. **Referral is additionally
> inexpressible:** `_resolve_org_paths` treats `()` and a hop tuple as mutually
> exclusive, so "own org **or** via shelter" has no declaration. `OrgScoped` needs an
> `own_org_or=("shelter",)` form (or similar) before Referral can cut over.

"Mechanical" here means the *domain path* is clean: org-scoped with no guardian rows
written at creation, so no §5-style redesign of CHANGE/DELETE semantics is needed.
Two distinct gates still block a cutover:

- **Tasks / Referrals** write guardian rows at creation (`assign_object_permissions`),
  the same over-permission pattern as notes §5: promoting CHANGE/DELETE onto the org
  role lets every role-holder at the org mutate every row in the org's scope, including
  cross-org rows the org should only view. They need the §5-equivalence design first.
- **Teams / Reports** have clean domain paths but their permissions live on the legacy
  `ORG_ADMIN` / `ORG_SUPERUSER` templates (§5.3). The grant predicate reads *Grants
  only*, and a scoped `Role` row does not exist for those templates, so no holder has a
  Grant for `add_team`/`view_reports` today. Cutting the read path over without first
  role-backing `ORG_ADMIN` would strip authority from every org admin at every org
  (shelter *and* outreach). They land atomically inside the §5.3 milestone, not as
  standalone cutovers.

The shelter playbook (declare `OrgScoped`, add `RoleDef`s, wire `visible()`/`can()` in
services/schema, drop legacy directives, regenerate schema + FE types) applies once a
domain's authority template is role-backed. The non-mechanical / blocked domains
(notes §5, clients §5.1, tasks/referrals §5, teams/reports §5.3) are the phase-4
design work; nothing in the predicate blocks them once those designs land.

## 5. Phase-4 cutover designs — notes/guardian and the migration's forward designs

This section holds the forward designs that gate and complete the migration (target
end-state; see the §2 legend). It **opens with the notes/guardian migration** — the
non-mechanical case (finding F23) — then: **§5.1** client writes (parity-first),
**§5.2** tier-3 FE capability surfacing, **§5.3** the org-admin role-backed milestone
(teams/reports/member-management — a migration item, not notes; it shares this
section for stack-numbering continuity).

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

### 5.1 Client writes — parity-first: shared read AND shared write (RFC 0002)

`ClientProfile` has **no organization FK** (no `clients/` migration ever added one). The
product rule (2026-09-02) is **not** "writes stay org-owned" — **reads and writes are
both platform-shared today**: client CHANGE/DELETE ride model-level permissions on the
legacy `CASEWORKER` group (`notes/groups.py`), so any caseworker in any org edits or
deletes any client. There are **no per-record guardian rows for `ClientProfile`**
(guardian per-record exists for notes/tasks/referrals/documents, not clients).

Under v2 with `org_via = None`, org-scoped writes are inexpressible — `scopes()` returns
org ids and the client has no org — and the object arm only covers per-record sharing.
The clients cutover is **parity-first** (RFC 0002): keep `ClientProfile` SHARED read and
SHARED write, where the write check is "holds the permission anywhere"
(`can_anywhere`) rather than org-scoped — no column, no backfill, no object grants at
creation. The owner-tier (`created_by_org`, org-scoped CHANGE/DELETE) is a future,
product-triggered write-tier change, not schema debt now. Full design: RFC 0002
(`docs/adr/0002-client-writes-ownership.md`).

Cross-org edit/delete of profiles beyond shared-write is an open product follow-up
(`docs/teams_org_scoping.md`); the model must make it expressible, not decide it.

### 5.2 Capability surfacing to the frontend — tiers 1–2 ship with phase 3, tier 3 with the cutover

The FE gates features on **capabilities, not raw grants** (finding F24). Three tiers:

1. **Global** — `currentUser.permissions`: the global tier (global Role perms +
   `user_permissions`; superuser → every permission). Ships with phase 3 (PR #2414).
2. **Per-org** — `currentUser.organizationsOrganization[].permissions`: the union of
   legacy group perms and Grant role perms (including delegated org→org grants) at each
   reachable org. Ships with phase 3 (PR #2414).
3. **Per-record** — object-grant capabilities: **not yet surfaced**, by decision. A
   platform-shared model with per-record edit authority (the object arm) is ungatable
   from tiers 1–2: an org-scoped gate hides the shared record's edit button, and a
   permission gate shows it on records the user cannot edit — the FE-shows-action /
   backend-refuses bug class. Tier 3 therefore ships **with the clients cutover**, not
   as a follow-up after it.

**Chosen tier-3 shape — per-record capability fields on whitelisted models**, resolved
through the predicate itself so the button and the mutation cannot disagree:

```graphql
type ClientProfileType {
  # ...
  canChange: Boolean!   # can_obj(user, ClientProfile.perms.CHANGE, self)
  canDelete: Boolean!   # can_obj(user, ClientProfile.perms.DELETE, self)
}
```

List queries batch these with an `Exists` annotation over the row's object grants rather
than a per-row `can_obj` call (avoids N+1). A generic `can(permission: String!)` field
is deliberately rejected — it cannot be batched and invites callers to enumerate
permissions the FE has no button for. `currentUser.objectGrants` (a raw-grant list) is
also rejected as the primary contract — the FE gates on capabilities, not grants; it
may be added later only if a "shared with me" surface needs it.

**Sequencing (decided):** per-domain backend cutover first, tier-3 surfacing second,
within the same wave — mirroring phase 2 → phase 3 for shelters (backend first,
reachability second). The client-write tier (§7.6, resolved parity-first in RFC 0002)
gates the clients cutover; the `can*` fields are the same either way (a `created_by_org`
FK anchors org-scoped writes; object grants anchor shared edits).

### 5.3 Org-admin role-backed milestone — teams, reports, and member management land together

Teams and reports look like the cleanest cutovers (§4.1): org-scoped rows, no guardian
rows at creation, pure `@hasOrgPerm`. They are not standalone, because **their
permissions ride the `ORG_ADMIN` / `ORG_SUPERUSER` templates** (`accounts/groups.py`),
which are legacy and cross-domain:

- `ORG_ADMIN` carries the team perms (`Team.perms.ADD/CHANGE/DELETE/VIEW`), the report
  perm (`ReportPermissions.VIEW_REPORTS`), the member-management perms
  (`ADD_ORG_MEMBER`, `REMOVE_ORG_MEMBER`, `VIEW_ORG_MEMBERS`) and
  `ACCESS_ORG_PORTAL`; `ORG_SUPERUSER` adds `CHANGE_ORG_MEMBER_ROLE`. Both templates
  are offered by **every** org type (`outreach` and `shelter`).
- No scoped `Role` row exists for either template, so **no holder has a Grant** for any
  of those perms; authority today is the legacy `PermissionGroup` membership read by
  `HasOrgPerm` → `permissioned_queryset`.
- The grant predicate reads Grants only (`scopes()`/`visible()`/`can()`, §2.4).
  Flipping teams (or reports, or member management) to `can()`/`visible()` before
  `ORG_ADMIN` is role-backed therefore returns *nothing* for every current org admin —
  the cutover would delete authority rather than move it.

Role-backing is all-or-nothing per template: the moment a scoped `Role` row named
"Organization Admin" exists, `reconcile_org_groups` stops creating its legacy
`PermissionGroup` and deletes stale rows (PR #2416), so **every** consumer of every
`ORG_ADMIN` perm loses its legacy read in the same deploy. The milestone must convert
them all atomically:

1. **RoleDefs** — `ORG_ADMIN_ROLE = RoleDef.from_template(ORG_ADMIN)` and
   `ORG_SUPERUSER_ROLE` (scoped, not global), registered with the shelter roles.
2. **Backfill** — for every org (shelter and outreach), convert existing
   `ORG_ADMIN`/`ORG_SUPERUSER` `PermissionGroup` memberships into Grants
   (idempotent, mirroring `backfill_shelter_grants`), run before `reconcile` deletes
   the legacy rows.
3. **Authority conversion in the same change set** (each domain's path is otherwise
   clean and follows the shelter playbook):
   - **Teams** — `Team` declares `OrgScoped` with `org_via = ()` (it owns its
     `organization` FK; the earlier `("organization",)` form was wrong — that hops
     *to* `Organization`, which is not `OrgScoped` and raises at import);
     `teams/selectors.py` and `teams/schema.py` move from `team_list(organization)`
     + `HasOrgPerm` to `visible()`/`can()`, with the org from the header and
     per-row `can_obj`-style checks on update/delete; drop the legacy directives.
   - **Reports** — read gate (`view_reports`) moves from `HasOrgPerm` /
     `get_user_permitted_org` to `can()`/`visible()`.
   - **Member management** — the `accounts` mutations gated on
     `ADD_ORG_MEMBER`/`REMOVE_ORG_MEMBER`/`CHANGE_ORG_MEMBER_ROLE`/`VIEW_ORG_MEMBERS`
     move to `can()`; member add/remove/role-change flows already write Grants for
     role-backed templates via `OrgRoleManager`, so this is the read-side flip.
   - **FE** — no new surfacing work: tier 2 (`organizationsOrganization[].permissions`,
     §5.2) already unions Grant role perms per org, so the admin app's org-scoped
     gates keep working once holders have Grants.
4. **Tests** — mirror the shelter cutover suite (`test_grant_cutover.py`): global-tier
   cross-org reads, grant-only org admin without legacy group still manages teams /
   members / reports, and the legacy-group-only holder (a `PermissionGroup` row left
   by a pre-backfill org) fails closed.

Why this is a milestone and not a "teams PR": the change set is *one template* —
`ORG_ADMIN`/`ORG_SUPERUSER` — cut over across its four consumers. Doing teams alone
either leaves the legacy group in place (predicate still returns nothing → broken) or
role-backs the template (members + reports break in the same deploy). It is scheduled
after the tasks/referrals §5-equivalence design only because that design is orthogonal
and already on the critical path for notes/clients; it can land in either order.

**Reviewability — the milestone ships as a stacked series, not one PR.** A single
large PR is risky to review, but the milestone cannot be split naively: the moment a
scoped `Role` row named "Organization Admin" exists, `reconcile_org_groups` retires
the legacy groups and every unconverted consumer breaks (above). So each consumer is
converted *ahead* of the Role rows behind a **transitional dual-read**: the mutation
passes if the user holds the permission via the grant predicate (`can()`, §2.4) **or**
via the legacy org-scoped check (`permissioned_queryset` — exactly what `HasOrgPerm`
checks today). Each PR is green alone: the legacy arm is current behavior, and the
grant arm is dormant until Role rows + backfill land. The stack:

1. **Teams** — a `HasOrgPermOrGrant` extension on the three team mutations (+ tests:
   a legacy `ORG_ADMIN` holder still passes; a scoped-Grant holder passes with no
   legacy group; neither is denied; a Grant at org A does not authorize acting at
   org B). The teams *query* stays membership-gated — workers pick teams for
   notes/tasks, so org members may read their org's teams (unchanged).
2. **Reports** — `view_reports` reads dual.
3. **Member management** — the four `accounts` member permissions read dual.
4. **Provisioning** — `ORG_ADMIN`/`ORG_SUPERUSER` RoleDefs + Role rows + backfill
   converting every existing org's admin `PermissionGroup` memberships into Grants;
   remove the legacy arms from (1)–(3) and retire the templates (reconcile deletes
   the legacy groups once the Role rows exist); tests go grant-only.

The dual-read helper is temporary by construction — deleted in step 4 — and the
predicate itself stays pure-grant throughout; only the *consumers* carry the
transitional arm. Schema directives change name as extensions are swapped
(`@hasOrgPerm` → `@hasOrgPermOrGrant` → none), so `schema.graphql` + FE types are
regenerated at each step.

## 6. References

- [SDB-218] — global shelter operator org-bypass ticket
- [PR #2407] — `feat/SDB-218/global-shelter-operator-org-bypass` (rejected direction;
  its test suite is retained as the behavioral contract)
- vecchp's design critique comments on [PR #2407] (Grant model, resolver, migration)
- `docs/teams_org_scoping.md` — product decision that cross-org *reads* (clients,
  notes/tasks) are deliberate and platform-shared

## 7. Decisions & open items (phase-0 gate)

Status tags: **[decided 2026-09-02]** / **[confirmed]** / **[open]**. Item numbers
are stable (referenced elsewhere and shared with the rest of the stack).

1. **Admin-created custom roles** (finding F21) — **[decided 2026-09-02: code-owned
   `RoleDef`s only for v1]**; admins may not create bespoke roles. Revisit only when a
   concrete org asks (then `is_global` ownership, sync, and E002 need explicit rules).
2. **`Shelter.organization` nullability** — **[open]** currently `SET_NULL`; orphans
   are reachable only at the global tier. Decide required-with-backfill vs. accept.
3. **Who administers org→org delegation** — **[decided 2026-09-02: BA staff in the
   Django admin only for v1]** (the `GrantInline`/`DelegatedGrantInline`). Org-admin
   self-service in the portal is deferred (needs guardrails, audit, and
   receiving-org confirmation).
4. **Client-sharing data edge shape** — **[decided 2026-09-02, v1:]** cross-org sharing
   is BA/staff creating person object grants in the Django admin (`grant_obj`), with
   revocation on org departure resolved in RFC 0002. An org-level *data edge* (a
   sharing relationship naming the orgs allowed to act) remains a future,
   product-triggered design — authority still resolves per-person; the edge never
   becomes an org-principal `Grant` (§2.5).
5. **`in_org` for scoped multi-org users** — **[confirmed]** header picks the active
   view; authority is unaffected. No further decision needed.
6. **Client-writes design (§5.1)** — **[decided 2026-09-02: RFC 0002]** per-model
   read/write tiers for platform-shared models with no org (parity-first — shared read
   AND shared write today via `can_anywhere`; owner-tier `created_by_org` parked for
   later product adoption). The tier-3 FE surfacing shape (§5.2 — `canChange`/
   `canDelete` via `can_obj`) is chosen regardless of which write tier wins. Decision:
   `docs/adr/0002-client-writes-ownership.md`.

[SDB-218]: https://betterangels.atlassian.net/browse/SDB-218
[PR #2407]: https://github.com/BetterAngelsLA/monorepo/pull/2407

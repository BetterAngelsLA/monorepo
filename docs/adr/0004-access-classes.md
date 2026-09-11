# ADR 0004 — Access classes for scoped models

**Status:** Proposed — sketch. Reference implementation: draft PR #2463
(stacked on #2461, which it converts end-to-end). Vocabulary folds RFC 0002's
write tiers (#2447) when the stacks meet.
**Date:** 2026-09-11
**Scope:** How authority is declared on org-scoped models and enforced; the
single-slot replacement for `write_tier` / `access_class`; enforcement across
definition, binding, and evaluation time.
**Related:** ADR 0001 (grant model), RFC 0002 (read/write tiers, #2447),
RFC 0003 (#2462 notes cutover), [PR #2461] (ContactInfo gates),
[PR #2463] (this sketch).

## Problem

Model authority is currently described by three overlapping, ad-hoc mechanisms,
plus call-site predicates that re-state rules wherever they are used:

- `org_via` — **reach**: which organization(s) a row lives in (ADR 0001).
- `write_tier` — RFC 0002 / #2447: `WRITE_SHARED` / `WRITE_OBJECT` — which
  *arm* computes the write filter.
- `holds_globally` → `can_globally` (#2461) — a **call-site predicate**: "does
  the user hold this perm at the global tier?" Because it is re-stated per
  surface, a missed call site **fails open**; #2461 needed a manual exposure
  audit to catch the risk.

Every new shape (BA-only fields, shared writes, object-arm writes,
parent-gated children) has been adding a new attribute or a new call-site
check. That is an open-ended keyword surface, and its failure mode is silent.

## Decision

One **authority slot** per model, next to reach:

```python
class ContactInfo(OrgScoped):
    org_via = ("shelter",)                     # reach (unchanged)
    access = Access(read=ACCESS_GLOBAL,        # authority classes
                    write=ACCESS_GLOBAL)
```

- **Reach stays separate** (`org_via`): where rows attach (object graph, grant
  scope, org filters). Reach alone never grants authority.
- **`Access(read, write)`** is a single declaration; values are a closed set:
  - `None` — derive today's behavior: reads by reach (org-scoped rows;
    platform-shared all-or-none), writes by the org arm.
  - `ACCESS_GLOBAL` — only the global tier passes; org scopes never widen it.
  - Folding #2447: `write` additionally takes `WRITE_SHARED` and
    `WRITE_OBJECT`; `PARENT` (authority delegated to an ancestor row — e.g.
    note-gated uploads) is reserved for the slice that needs it.
- **Selectors are the single enforcement surface**: `visible`, `writable`,
  `can_obj`, and the rowless `can_model`. Surfaces and services ask selectors;
  no call-site tier predicates in product code.
- **Direction** resolves by codename convention today (`view_*` → `read`;
  everything else → `write`), in one helper. If custom codenames appear, the
  direction moves onto `PermissionSet` — never into callers.
- **Delete the interim names** when folding (`write_tier`, `access_class`);
  no aliases.

## Enforcement layers (why one is not enough)

The class is enforced at **three** times; each catches what the others cannot:

1. **Definition time — E-codes.** "Scoped `RoleDef`s may not carry abilities
   on `ACCESS_GLOBAL` models" and "`access` values must be legal" (a typo is an
   error, not a silent fall back to org rules). This mechanizes the audit
   #2461 performed by hand.
2. **Binding time — admittance.** Role seeding (`sync_roles`) and
   `grant_create` validate the same rule: *a scoped binding can never acquire a
   GLOBAL-class ability.* Grants are the only way authority enters the system;
   constraining admittance means the grant table itself can never hold an
   ability the model forbids. (This is the "seed the grant table with access
   ability" reading — with the model's declaration filtering what can be
   seeded.)
3. **Evaluation time — selectors branch on the declaration.** Kept even when
   (1) and (2) hold: checks are dev-time and drift happens (manual rows,
   migrations, future code paths); evaluation is the only layer that fails
   closed regardless. It is also the only layer that can express **shape
   classes** — `SHARED`/`OBJECT`/`PARENT` change *how* the filter computes,
   not just who may pass.

**Rejected alternatives.**

- *Binding-time only* (validate at seeding / DB constraint, class-free
  evaluator): fails open on drift, and cannot express shape classes.
- *Materialized per-grant ability rows* (denormalize each grant's effective
  abilities at creation): reintroduces the guardian era's sync disease that
  ADR 0001 §2.1 removed — derived rows re-seeded on every template or class
  change, with staleness windows. Evaluation already caches computed scopes
  per request (`_scope_cache`, `_global_permissions`); persistent copies buy
  little and rot.

## Consequences

- One fact, one place: "who may touch these rows" is declared once, enforced
  everywhere via selectors, and validated at role-definition and
  grant-creation time.
- New model shapes compose as *enum values + declaration slots*; no new
  keywords, and `explain` can render the declared chain.
- Costs: indirection (reading authority means reading the declaration), and
  the validation layers must be extended whenever a class value is added.
- `can_model`'s fallback for non-GLOBAL models keeps today's `can_anywhere`
  semantics until the matrix defines per-class rowless rules; consumers of
  non-GLOBAL classes must wait for that decision (see Open questions).

## Rollout

1. **This PR (#2463)** — read-side seed: `Access` slot, `ACCESS_GLOBAL`,
   `can_model`, the `visible` branch; converts #2461's ContactInfo gates
   (`shelter_update` service + the `additional_contacts` resolver) to the
   declaration. Behavior-preserving: same refusal, same message as #2461's
   service; two GraphQL assertions stranded by `c418bffb3`'s message change
   are realigned in this PR.
2. **Fold #2447** — `WRITE_SHARED` / `WRITE_OBJECT` become `Access.write`
   values; `writable()` branches read the slot; `write_tier` is deleted.
3. **Validation** — add the layer-1 E-codes; extend the gating tripwire so
   authority attributes cannot sprawl; one styleguide rule: new authority
   rules land as enum values, not attributes.
4. **Mixin rename** — `OrgScoped` → `ScopedResource` (mechanical, separate
   PR; `org_via` keeps its name as the reach attribute).

## Open questions

- **Totality**: should every model elect its classes explicitly (auditable
  election), or keep derive-from-reach defaults (current)? Recommend defaults
  plus E-code-derived constraints; revisit as the class set grows.
- **Per-permission classes**: `Access` is per-direction. If a real case needs
  per-perm granularity (VIEW org-wide / CHANGE global), grow the slot — do not
  add a second attribute.
- **Explicit direction**: move the `view_*`-prefix inference onto
  `PermissionSet` when custom codenames first appear.
- **`can_model` fallback**: define per-class rowless semantics before any
  non-GLOBAL class gains consumers; today's fallback is deliberately permissive
  and footgun-shaped.

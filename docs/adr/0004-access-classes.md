# ADR 0004 — Access classes for scoped models

**Status:** Accepted (2026-09-28). Implemented: write tiers folded in #2477
(the `write_tier` → `Access.write` fold), read side completed in #2477,
which absorbs the #2463 sketch.
**Date:** 2026-09-28
**Scope:** How authority is declared on org-scoped models and enforced; the
single-slot replacement for `write_tier` / ad-hoc call-site tier predicates.
**Related:** ADR 0001 (grant model), ADR 0002 (client writes), RFC 0002
(read/write tiers, folded), PR #2477 (implementation), PR #2463 (sketch),
PR #2461 (ContactInfo gates, converted).

## Problem

Model authority was described by overlapping mechanisms plus call-site
predicates that re-stated the same rule wherever it was used:

- `org_via` — **reach**: which organization(s) a row lives in (ADR 0001).
- `write_tier` — RFC 0002: `WRITE_SHARED` / `WRITE_OBJECT` — which *arm*
  computes the write filter.
- `can_globally` call sites — "does the user hold this perm at the global
  tier?" restated per surface; a missed call site **fails open**. The
  ContactInfo gates needed a manual exposure audit to catch the risk.

Every new shape (BA-only fields, shared writes, object-arm writes,
parent-gated children) was adding a new attribute or a new call-site check.
That is an open-ended keyword surface, and its failure mode is silent.

## Decision

One **authority slot** per model, next to reach:

```python
class ContactInfo(OrgScoped):
    org_via = ("shelter",)                       # reach (unchanged)
    access = Access(read=ACCESS_GLOBAL,          # authority classes
                    write=WRITE_GLOBAL)
```

- **Reach stays separate** (`org_via`): where rows attach (object graph,
  grant scope, org filters). Reach alone never grants authority.
- **`Access(read, write)`** is a single declaration; values are a closed set:
  - **read** — `None` (derive by reach: org-scoped rows; all-or-none for a
    platform-shared model) or `ACCESS_GLOBAL` (only the global tier passes;
    org scopes never widen it).
  - **write** — `None` (derive: ORG for an org-anchored model, fail closed
    for a platform-shared one), `WRITE_SHARED` (any holder anywhere),
    `WRITE_GLOBAL` (global tier only — the org-anchored narrowing), or
    `WRITE_OBJECT` (per-record object grants — reserved until the object arm
    has a consumer).
- **Direction resolves by codename** — `view_*` → `read`, everything else →
  `write` — in one helper (`selectors._access_class`). If custom codenames
  appear, the direction moves onto `PermissionSet` — never into callers.
- **Selectors are the single enforcement surface**: `visible`, `writable`,
  `can_obj`, and the rowless `can_model`. Surfaces and services ask the
  selectors; product code carries no tier predicates.

## Enforcement layers (why one is not enough)

The class is enforced at three times; each catches what the others cannot:

1. **Definition time — `permissions.E007`.** Declared values must be legal;
   a typo is an error, not a silent fall back to the derived rules. Unknown
   values and reserved classes (`WRITE_OBJECT`) fail the deploy.
2. **Binding time — admittance.** Role seeding (`sync_roles`) and
   `grant_create` should refuse *scoped* bindings of GLOBAL-class abilities:
   grants are the only way authority enters the system, so constraining
   admittance means the grant table can never hold an ability the model
   forbids. **Not yet mechanized** — today this is enforced by review plus
   the reference model's role wiring (only the global GSO role carries the
   ContactInfo perms); tracked as a follow-up check.
3. **Evaluation time — selectors branch on the declaration.** Kept even when
   (1) and (2) hold: checks are dev-time and drift happens (manual rows,
   migrations, future code paths); evaluation is the only layer that fails
   closed regardless. It is also the only layer that can express **shape
   classes** — `SHARED`/`OBJECT` change *how* the filter computes, not just
   who may pass.

**Rejected alternatives.**

- *Binding-time only* (validate at seeding / DB constraint, class-free
  evaluator): fails open on drift, and cannot express shape classes.
- *Materialized per-grant ability rows* (denormalize each grant's effective
  abilities): reintroduces the guardian era's sync disease that ADR 0001
  §2.1 removed — derived rows re-seeded on every template or class change,
  with staleness windows. Evaluation already caches computed scopes per
  request (`_scope_cache`, `_global_permissions`); persistent copies buy
  little and rot.

## Consequences

- One fact, one place: "who may touch these rows" is declared once, enforced
  everywhere via selectors, and validated at deploy time.
- New model shapes compose as *enum values + declaration slots*; no new
  keywords.
- `explain_permission` renders the declared chain: GLOBAL read/write classes
  print their own notes instead of the derived-reach lines.
- Costs: indirection (reading authority means reading the declaration), and
  the validation layers must be extended whenever a class value is added.
- `can_model`'s fallback for non-GLOBAL models keeps `can_anywhere`
  semantics until per-class rowless rules are defined; consumers of
  non-GLOBAL classes must wait for that decision.

## Rollout

1. **Write tiers** — `write_tier` deleted; `WRITE_SHARED` / `WRITE_OBJECT`
   live in `Access.write`; `writable()` / `get_writable_or_deny()` are the
   mutation gates (folded in #2477).
2. **Read side (this completion)** — `ACCESS_GLOBAL` + `WRITE_GLOBAL`,
   `can_model`, the `visible` declaration branch; `ContactInfo` converted
   end-to-end (`shelter_update` service gate + the `additional_contacts`
   resolver). Behavior-preserving: same refusals, same messages.
3. **Validation** — `permissions.E007` covers both slots (definition time);
   the binding-time admittance rule is the remaining layer.
4. **Follow-ups** — binding-time admittance rule; `WRITE_OBJECT` activation
   with the object arm (ADR 0001 §2.5); `PARENT`-class children if a real
   case lands; `OrgScoped` → `ScopedResource` rename (mechanical, separate).

## Open questions

- **Totality**: should every model elect its classes explicitly (auditable
  election), or keep derive-from-reach defaults? Current: defaults plus
  E007-validated overrides; revisit as the class set grows.
- **Per-permission classes**: `Access` is per-direction. If a real case
  needs per-perm granularity (VIEW org-wide / CHANGE global), grow the slot —
  do not add a second attribute.
- **`can_model` fallback**: define per-class rowless semantics before any
  non-GLOBAL class gains consumers; today's fallback is deliberately
  permissive and footgun-shaped.

# ADR 0005 — Access classes for scoped models

**Status:** Partially implemented. The **write direction** ships: `Access.write`
with `AccessClass` (`DERIVED` via `None`, `SHARED`, `OBJECT` reserved), declared
on `BaseModel`/`OrgScoped` and enforced by `writable`/`can_obj`, with
`permissions.E007` keeping the vocabulary closed. The **read direction** is
declared but not enforced — see [Deferred](#deferred).
**Date:** 2026-11-10
**Scope:** How authority is declared on a model and enforced, independent of how
its rows reach an organization. Replaces `write_tier` (RFC 0002) and the
per-surface `can_globally` restatements it grew alongside.
**Related:** ADR 0001 (grant model), ADR 0002 (client writes), RFC 0003 (the
caseworker cutovers), PR #2688 (this slice).

> **Numbering note.** This design was drafted as "ADR 0004" on an unmerged
> branch while ADR 0004 (shelter audit log) landed on `main`. It is numbered
> **0005** here; every reference to "ADR 0004" that means access classes is now
> a reference to this document.

## Problem

Two things describe a row's authority, and they were conflated:

- **Reach** (`org_via`) — which organization(s) a row lives in.
- **Authority** — which check decides whether a user may read or write it.

Reach alone does not determine authority. A platform-shared model
(`org_via = None`) has rows in no organization, yet its writes may be shared by
any holder of the permission; a model with no `OrgScoped` declaration at all has
no reach and can only fail closed.

Before this slice the second half was `write_tier`, a bare string attribute
consulted at one place — but the same rule was also restated at call sites
(`can_globally(...)` per surface), which **fails open** when a surface is missed.
Every new shape (BA-only fields, shared writes, parent-gated children) added
either a new attribute or a new call-site check: an open-ended keyword surface
whose failure mode is silent.

## Decision

One declaration slot per model, next to reach:

```python
class ClientProfile(OrgScoped, AbstractClientProfile):
    org_via = None                      # reach: platform-shared
    access = Access(write=AccessClass.SHARED)   # authority: any holder, anywhere
```

- **`Access` is a frozen dataclass on `BaseModel` and `OrgScoped`.** It carries
  one field per direction. `None` means *derive*; an explicit value names the
  class the selectors enforce.
- **The vocabulary is a closed enum**, `AccessClass`, not bare strings. Nothing
  type-checks a class attribute at runtime, so the enum is what makes
  `Access(write="shared")`, `Access(write=WRITE_SHARED)` (the constant's name)
  and a misspelling type errors rather than deploy-time surprises.
- **`writable`/`can_obj` are the single enforcement surface.** Product code
  carries no tier predicate; it asks the selector.
- **`permissions.E007` keeps the declaration honest** — it refuses a write class
  on an org-anchored model (which derives ORG from its anchor), a non-enum
  value, a reserved class, and any read value until the read direction exists.

### Write classes

| `access.write` | Meaning |
|---|---|
| `None` | **Derive.** ORG if the model is org-anchored (`org_via` not `None`); otherwise fail closed — a platform-shared model acts only for the global tier, a reachless one for nobody. |
| `AccessClass.SHARED` | Any holder of the permission **anywhere** may act (`can_anywhere`). |
| `AccessClass.OBJECT` | Only a per-record object `Grant` (or the global tier) may act. **Reserved** — the object arm turns on with the client-document cutover (ADR 0001 §2.5); E007 refuses it until then. |

### Why the slot lives on `BaseModel`

`OrgScoped` and `BaseModel` are siblings, not a hierarchy, and the model that
needs an explicit class most is *not* org-scoped: `Attachment` / `ClientDocument`
declares no reach, so before this slice `writable()` short-circuited it to
`.none()` for everyone with no way to say otherwise. Declaring the slot on both
bases makes it reachable from either side; a reachless model that declares
`SHARED` is admitted by `can_anywhere`, and one that declares nothing still
fails closed exactly as before.

This is also why `WRITE_OBJECT` cannot be the answer for attachments today: an
object grant names a record, and the reachlessness that makes the slot necessary
is the same thing that makes the derived default useless there. Whatever the
client-document cutover picks, it has to pick a class explicitly.

## Deferred

These are named here so the gap is documented rather than implied by a slot that
does nothing:

- **The read direction.** `access.read` exists and E007 refuses every value.
  The first consumer is the platform-only field (`ContactInfo`,
  `shelters/models/shelter.py`), currently gated by a centralized
  `can_globally` permission class rather than by declaration. When `visible()`
  implements the read direction, `AccessClass.GLOBAL` becomes its first value
  and that class can drop out.
- **`AccessClass.GLOBAL` as a *write* class** — the org-anchored narrowing
  ("global tier only", which reach cannot express).
- **A rowless predicate** (`can_model`) so a caller can ask the class question
  without a row in hand.

## Consequences

- A model's authority is one greppable declaration instead of a call-site
  convention, and `permissions.E007` fails the deploy if it is malformed.
- `writable`/`can_obj` keep their existing behaviour for every model that does
  not declare a class — this slice is a rename plus a reachability fix, not a
  change in who may act.
- The selectors grew one branch (`reachless + declared class`); the equivalence
  test that pins `writable` to `can_obj` covers it.

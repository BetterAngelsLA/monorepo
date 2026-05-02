# Principles

> **Status: draft.** This is the initial version of the principles, pending
> team review. Each principle is in its own file under [`principles-list/`](./principles-list/)
> so it can be reviewed individually, and include its own supporting evidence.
> Below the principle definition, each per-principle file contains review-stage
> working notes (Notes, Open questions, Origin reference) that exist only for the
> initial review and will be removed once principles are adopted.

How the BetterAngels Tech Team makes tradeoffs. Each principle follows the
[principle format](./reference/principle-format.md): an `X over Y` title,
a one-sentence explanation, a concrete decision check, and the failure
modes that justify its existence.

Principles are **universal** (they hold across products and phases) and
**immutable** (added or removed, not edited). When circumstances change, the
[active context](./reference/context.md) determines which principle wins
when two conflict.

The list is **unordered** — numbering would imply priority, and these
principles apply together rather than in sequence. They are listed
alphabetically by title.

Terms used — **Customer**, **User**, **Persona**, **Active User**, etc. —
are defined in the [terminology glossary](./reference/terminology.md).

---

## The principles

- [Evidence over Assumptions](./principles-list/evidence-over-assumptions.md)
- [Proven Processes over Reinvention](./principles-list/proven-processes-over-reinvention.md)
- [Real Constraints over Ideal Design](./principles-list/real-constraints-over-ideal-design.md)
- [Scalable Solutions over Individual Customers' Needs](./principles-list/scalable-solutions-over-individual-customers-needs.md)
- [Small Experiments over Large Builds](./principles-list/small-experiments-over-large-builds.md)
- [User Adoption over Features](./principles-list/user-adoption-over-features.md)

## Scope: user-facing work vs. infrastructure

The principles above apply to **user-facing product work** — features, workflows, and UX that real Users interact with.

**Infrastructure work** (data models, auth, deploy pipelines, internal tooling, refactors with no user-visible change) is **out of scope** for principle-by-principle gating. Several principles — _User Adoption over Features_ (adoption-within-a-quarter), _Evidence over Assumptions_ (named-Persona Focus check, behavioral Evidence check), and _Small Experiments over Large Builds_ (4-week pilot) — cannot meaningfully apply to infra and would generate noise if forced to.

Infra decisions are governed by [context](./reference/context.md) instead. Individual principle files may note exceptions in their **Notes**, but the default is: principles target user-facing work.

> _The per-principle content (explanation, decision check, open questions,
> origin) lives in each file linked above. This split is temporary to make
> review easier; the content may be consolidated back into a single file
> once the principles are finalized._

---

## Reflections and questions not covered by these principles

Some items from the reflection notes do not map to any current principle.
They are tracked separately in [unmapped.md](./reference/unmapped.md),
with an explanation for why each is left out and suggested follow-ups
for the team.

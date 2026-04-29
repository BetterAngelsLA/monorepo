# Principles

> **Status: draft.** This is the initial version of the principles, pending
> team review. Each principle is currently in its own file under
> [`list/`](./list/) so it can be reviewed individually. Each per-principle
> file contains an **Open questions** section flagging decisions that still
> need to be made before this is final, and an **Origin** section linking
> back to the reflection notes. Resolved questions should be removed.

How the BetterAngels tech team makes tradeoffs. Each principle follows the
[principle format](./reference/principle-format.md): a value preference (`X over Y`),
a one-sentence explanation, and a concrete decision check.

Principles are **universal** (they hold across products and phases) and
**immutable** (added or removed, not edited). When circumstances change, the
[active context](./reference/context.md) determines which principle wins
when two conflict.

Terms used — **Customer**, **User**, **Persona**, **Active User**, etc. —
are defined in the [terminology glossary](./reference/terminology.md).

---

## The principles

1. [User Adoption over Features](./principles-list/01-user-adoption-over-features.md)
2. [Validated Learning over Assumptions](./principles-list/02-validated-learning-over-assumptions.md)
3. [Small Experiments over Large Builds](./principles-list/03-small-experiments-over-large-builds.md)
4. [Workflow Integration over Standalone Tools](./principles-list/04-workflow-integration-over-standalone-tools.md)
5. [Outcome Metrics over Proxy Metrics](./principles-list/05-outcome-metrics-over-proxy-metrics.md) — _aspirational; see file_
6. [Focus over Coverage](./principles-list/06-focus-over-coverage.md)
7. [Real Constraints over Ideal Design](./principles-list/07-real-constraints-over-ideal-design.md)
8. [Scalable Solutions over Individual Customers' Needs](./principles-list/08-scalable-solutions-over-individual-customers-needs.md)
9. [Aligned Incentives over Stated Needs](./principles-list/09-aligned-incentives-over-stated-needs.md)

## Scope: user-facing work vs. infrastructure

The principles above apply to **user-facing product work** — features, workflows, and UX that real Users interact with.

**Infrastructure work** (data models, auth, deploy pipelines, internal tooling, refactors with no user-visible change) is **out of scope** for principle-by-principle gating. Several principles (#1 adoption-within-a-quarter, #3 4-week pilot, #5 outcome metric, #6 named persona) cannot meaningfully apply to infra and would generate noise if forced to.

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

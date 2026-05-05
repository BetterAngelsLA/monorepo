# Principles

> **Status: draft.** This is the initial version of the principles, pending
> team review. Each principle is in its own file under [`principles-list/`](./principles-list/)
> so it can be reviewed individually, and include its own supporting evidence.
> Below the principle definition, each per-principle file contains review-stage
> working notes (Notes, Open questions, Origin reference) that exist only for the
> initial review and will be removed once principles are adopted.

## Why principles

The BetterAngels Tech Team makes a lot of decisions where reasonable people
disagree: ship now vs. polish, scale a workflow vs. solve one user's
problem, add a feature vs. validate the one we just shipped. Principles
exist so we make those calls consistently — not by relitigating from
scratch each time, and not by whoever argues hardest in the room.

Each principle names a tradeoff we've already decided how to resolve, so
the team can move faster and stay aligned without a manager in the loop.

## How to read them

Each principle follows the [principle format](./reference/principle-format.md):
an `X over Y` title, a one-sentence explanation, a concrete decision check,
and the failure modes that justify its existence.

Principles apply together — they describe different aspects of the same
way of working, not steps in a sequence. The list is not prioritized; no
principle outranks another by default.

Terms like **Customer**, **User**, **Persona**, and **Active User** are
defined in the [terminology glossary](./reference/terminology.md).

## Principles and context

Principles are **universal** (they hold across products and phases) and
**immutable** (added or removed, not edited). They apply everywhere, every
day.

What can change is the context. An
[active context](./reference/context.md) names a particular situation we
may be in and which principles it prioritizes in that situation. A new or
updated context may shift priority between principles — but until that
happens, the priorities it sets are the priorities, so the team weights
them consistently.

If a principle feels wrong for a situation, the answer is usually one of:
the active context already adjusts the priority, the situation is
infrastructure work (out of scope — see below), or there's a missing
context that should be defined.

---

## The principles

- [Evidence over Assumptions](./principles-list/evidence-over-assumptions.md)
- [Proven Processes over Reinvention](./principles-list/proven-processes-over-reinvention.md)
- [Real Constraints over Ideal Design](./principles-list/real-constraints-over-ideal-design.md)
- [Scalable Solutions over Individual Customers' Needs](./principles-list/scalable-solutions-over-individual-customers-needs.md)
- [Small Experiments over Large Builds](./principles-list/small-experiments-over-large-builds.md)
- [User Adoption over Features](./principles-list/user-adoption-over-features.md)

## Active contexts

- [Outreach App — Customer Acquisition](./context/product/outreach-app__customer-acquisition.md)
- [Shelter-operator — Customer Acquisition](./context/product/shelter-operator__customer-acquisition.md)

For the full index (including retired contexts), see [context/](./context/).
For the schema and rules, see [context.md](./reference/context.md).

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

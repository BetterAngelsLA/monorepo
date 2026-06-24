# Shelter Placement Queue

## TL;DR

> **What:** A global placement queue where caseworkers refer homeless clients, shelters see only compatible matches, and shelters can claim clients for placement — all driven by a shared eligibility criteria system.

> **Why:** Today, caseworkers must know *which* shelter has space for a client. Shelters have no way to discover compatible clients waiting for placement. This creates friction, slows placements, and leaves beds unfilled while clients wait.

> **How:** A single new model (`EligibilityCriterion`) provides a shared vocabulary of client attributes. Criteria are derived from client profile fields once at referral creation and frozen on the referral. Shelters are matched against referrals via their *existing* acceptance M2Ms (demographics, accessibility, etc.) using a simple lookup dict — no data duplication, no sync issues. Shelters claim clients from the queue in a two-step process (accept → later create Reservation), with optional email digest notifications.

---

## The Problem

Caseworkers referring homeless clients to shelters face two unknowns:

1. **Which shelter can take this client?** A 62-year-old female veteran with a service dog needs a shelter that accepts seniors, women, veterans, and pets. The caseworker has to manually match these needs against shelters they're familiar with.

2. **Does that shelter have space?** Even if the caseworker knows a compatible shelter, they don't know if beds are available.

Meanwhile, shelters have beds sitting empty and no way to proactively discover compatible clients waiting for placement.

---

## The Proposal

A **global placement queue** with three core ideas:

1. **Caseworkers refer clients into a shared pool** — optionally targeting a specific shelter, or leaving it open for any compatible shelter to claim.

2. **Matching is automated** — Client profile fields are mapped to eligibility criteria at referral time. Shelters are matched based on their existing acceptance attributes. Shelters only see clients compatible with who they serve.

3. **Shelters pull from the queue** — Shelter operators view matching clients, claim them, and later complete placement via the existing Reservation workflow. Optional email digests keep shelters informed of new matches.

---

## Detailed Design

| Document | Contents |
|---|---|
| [`scope.md`](./scope.md) | What changes, what stays the same, migration impact |
| [`models.md`](./models.md) | All new and modified model definitions (EligibilityCriterion, Referral) |
| [`matching.md`](./matching.md) | Matching engine — derivation, lookup dict, and shelter query |
| [`workflow.md`](./workflow.md) | Acceptance flow, referral creation, queue view, lifecycle diagrams |
| [`decisions.md`](./decisions.md) | Key decisions with rationale and trade-offs |
| [`api.md`](./api.md) | GraphQL queries, mutations, types, and schema |
| [`frontend.md`](./frontend.md) | shelter-web pages, routes, UX flow; mobile app referral creation; future shelter intake |
| [`notifications.md`](./notifications.md) | Email subscription model, Celery task, digest format |
| [`alternatives/`](./alternatives/index.md) | Options evaluated and rationale for the chosen approach |

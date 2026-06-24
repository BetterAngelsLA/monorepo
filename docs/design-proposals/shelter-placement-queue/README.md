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

### Current State

| Today | Pain point |
|---|---|
| Referrals must target a specific shelter | Caseworker needs encyclopedic knowledge of every shelter's profile |
| No matching mechanism exists | Compatibility checks are manual and ad-hoc |
| No queue concept | Clients fall through the cracks if the first shelter says no |
| Shelters are passive | They wait for referrals to arrive; can't pull from a pool |

---

## The Proposal

A **global placement queue** with three core ideas:

1. **Caseworkers refer clients into a shared pool** — optionally targeting a specific shelter, or leaving it open for any compatible shelter to claim.

2. **Matching is automated** — Client profile fields are mapped to eligibility criteria at referral time. Shelters are matched based on their existing acceptance attributes. Shelters only see clients compatible with who they serve.

3. **Shelters pull from the queue** — Shelter operators view matching clients, claim them, and later complete placement via the existing Reservation workflow. Optional email digests keep shelters informed of new matches.

### What changes

| Component | Change |
|---|---|
| `Referral` model | New `QUEUED` status, new `criteria` M2M |
| New: `EligibilityCriterion` | Shared vocabulary of matchable attributes (veteran, senior, family, etc.) |
| New: `QueueNotificationSubscription` | Per-shelter email digest settings |
| `shelter-web` | New Queue page + Notification Settings page |
| `betterangels` mobile | Future: caseworker referral creation |

### What does NOT change

- `ClientProfile` — no new fields, no derived data
- `Shelter` existing M2Ms — demographics, accessibility, etc. remain the source of truth
- `Reservation` workflow — placements still go through the existing system
- `betterangels-admin` — no changes

---

## Detailed Design

| Document | Contents |
|---|---|
| [`architecture.md`](./architecture.md) | Core models, matching engine, acceptance workflow, data flow diagrams |
| [`api.md`](./api.md) | GraphQL queries, mutations, types, and schema |
| [`frontend.md`](./frontend.md) | shelter-web pages, routes, UX flow; mobile app referral creation; future shelter intake |
| [`notifications.md`](./notifications.md) | Email subscription model, Celery task, digest format |
| [`alternatives.md`](./alternatives.md) | Options evaluated and rationale for the chosen approach |

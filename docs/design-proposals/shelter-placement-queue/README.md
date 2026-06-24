# Shelter Placement Queue

## TL;DR

> **What:** A global placement queue where caseworkers refer homeless clients, shelters see only compatible matches, and shelters can claim clients for placement — all driven by a shared eligibility criteria system.

> **Why:** Today, caseworkers must know *which* shelter has space for a client. Shelters have no way to discover compatible clients waiting for placement. This creates friction, slows placements, and leaves beds unfilled while clients wait.

> **How:** A single new model (`EligibilityCriterion`) provides a shared vocabulary of client attributes. Criteria are derived from client profile fields once at referral creation and frozen on the referral. Shelters are matched against referrals via their *existing* acceptance M2Ms (demographics, accessibility, etc.) using a simple lookup dict — no data duplication, no sync issues. Shelters claim clients from the queue in a two-step process (accept → later create Reservation), with optional email digest notifications.

---

## Purpose

Enable caseworkers to refer clients into a **global placement queue** where shelters can discover and claim compatible clients for placement — without the caseworker needing to know which shelter has availability.

## Problem

Currently, caseworkers must know both *which* shelter to refer to and whether that shelter has space. There is no mechanism for:

1. **Caseworkers** to submit a client into a general pool for shelter matching
2. **Shelters** to discover and claim compatible clients from a queue
3. **Shelters** to receive notifications about clients matching their acceptance criteria

## Decisions at a Glance

| # | Decision | Choice |
|---|---|---|
| 1 | Referral model | **Hybrid** — open (`QUEUED`, shelter=null) + targeted (`PENDING`, shelter set) |
| 2 | Matching engine | **EligibilityCriterion** on Referral only, shelters use existing M2Ms with a lookup dict |
| 3 | Acceptance workflow | **Two-step** — shelter claims (ACCEPTED) → later creates Reservation |
| 4 | Notifications | **QueueNotificationSubscription** model — daily/weekly/on-demand email digests |
| 5 | Frontend | **shelter-web** operator portal (Queue page, Notification Settings); **betterangels** mobile app (referral creation, role-based); future shelter intake |
| 6 | Permissions | **Global queue** — attribute-filtered shelter views, no org silos |

## Documents

| Document | Contents |
|---|---|
| [`architecture.md`](./architecture.md) | Core models, matching engine, acceptance workflow, data flow diagrams |
| [`api.md`](./api.md) | GraphQL queries, mutations, types, and schema |
| [`frontend.md`](./frontend.md) | shelter-web pages, routes, UX flow; mobile app referral creation; future shelter intake |
| [`notifications.md`](./notifications.md) | Email subscription model, Celery task, digest format |
| [`alternatives.md`](./alternatives.md) | Options evaluated and rationale for the chosen approach |

## Quick Reference

```
CASEWORKER                      GLOBAL QUEUE                      SHELTER
──────────                      ────────────                      ───────

Refer client ────►         All open referrals               Shelter sees only
(shelter=null,              waiting for match               compatible clients
 status=QUEUED)                                              (criteria overlap)
                                     │
                           Shelter clicks "Accept"
                                     │
                                     ▼
                           Client claimed
                           Removed from queue
                           Reservation created later
```

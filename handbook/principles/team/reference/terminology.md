# Terminology

Shared vocabulary used across [`principles.md`](../principles.md), the
[principle format](./principle-format.md), and the [context definition](./context.md).

## Why this exists

Principles only work if everyone reads them the same way. "Adoption,"
"users," "outcomes" each have multiple plausible meanings, and the wrong
interpretation has cost us before — most clearly when "customer signed"
was treated as equivalent to "users using the product."

This file fixes the meaning of the terms we use most often, so that:

- Principles and decision checks resolve to the same answer regardless of who
  is reading them.
- We measure the things our decision checks reference. If a decision check
  asks about "active users in the next quarter," we need to actually be
  measuring active users — otherwise the principle can't be applied.
- New team members and outside contributors don't have to guess at intent.

This is a living glossary. Add terms as they come up; remove terms that fall
out of use.

---

## 1. Principles vs Values

We use **Principles**, not Values, throughout this handbook.

- **Principle** — a constraint that helps make decisions. Stated as `X over Y`.
- **Value** — a statement of what we care about. Less prescriptive, harder to
  apply to a specific decision.

We chose "Principles" because the format ([principle format](./principle-format.md))
is built around forcing tradeoffs, which is closer to a constraint than a value.

Specifically: we use **Principles** (not "Guiding Principles" or "Tech Team
Principles" — the qualifier is implied by the location of this document).

---

## 2. People and organizations

We need to distinguish **customer-level outcomes** (organizations adopting
the product) from **user-level behavior** (individuals using the products).
Conflating the two has been one of our most expensive past mistakes.

### Customer

An **organization** that adopts or is onboarded onto our platform —
e.g., a non-profit, shelter, or government entity.

Internal BetterAngels groups (e.g., individual pillars) are also Customers
in this terminology. Treating internal and external customers the same way
prevents bias toward internal stakeholders.

**Examples:**

- External: A nonprofit org, a partner shelter
- Internal: BetterAngels (each pillar may be a separate Customer)

### User

An **individual** who interacts with one of our products.

Includes:

- **Day-to-day users** — e.g., caseworkers, volunteers
- **Decision-makers** — e.g., admins, leadership at a Customer

**Examples:**

- A nonprofit org volunteer
- A nonprofit org admin
- A shelter staff member
- A BetterAngels volunteer

### Persona

A **type** of User, defined by role or behavior. Personas are how we make
[Focus over Coverage](../principles.md) decisions: naming a single Persona
is the test of whether a feature is targeted enough.

Current personas include (non-exhaustive):

- **Client** — an unhoused individual receiving services
- **Caseworker** — a day-to-day user delivering services
- **Volunteer** — a day-to-day user supporting service delivery
- **Admin** — a User who configures or manages the system
- **Decision-maker** — a User who influences Customer-level decisions
  (e.g., whether to adopt or expand usage)

### Persona vs. Customer

This distinction matters because two principles depend on it pulling in
opposite directions, and they only stay consistent if the terms are
kept separate:

- **Persona = role** (Caseworker, Volunteer, Admin, Client).
  [#6 Focus over Coverage](../principles-list/06-focus-over-coverage.md)
  says narrow the role.
- **Customer = organization** (a nonprofit org, a CoC, an internal pillar).
  [#8 Scalable Solutions](../principles-list/08-scalable-solutions-over-individual-customers-needs.md)
  says don't narrow the organization.

A correctly scoped feature targets **one Persona across many Customers** —
not one Customer's specific Persona. "Caseworkers at any shelter" is
right. "A specific nonprofit org's caseworkers" is single-Customer work and triggers #8.

When the only available pilot Customer is also the only Customer with
that Persona, this is a known tension — see #8's open questions on
pilot methodology.

---

## 3. Usage and engagement

We need standard usage metrics so that decision checks like _"will this
materially increase active users?"_ can be answered with data instead of
opinion. Without these, every team member uses a slightly different
definition and our principles become unenforceable.

The terms below are **industry standard** (Mixpanel, Amplitude, growth
analytics) and intentionally not BetterAngels-specific. Each product is
expected to define its **qualifying action** (what counts as "use") and
the **window** (per day, per week, per month), but the term itself stays
constant.

### Active User

A User who performed a **qualifying action** within a defined time window.

Each product must define:

- The qualifying action (e.g., "created or edited a client interaction")
- The window (daily, weekly, monthly)

Logging in alone does not count. Activity must produce or consume real work.

### MAU / WAU / DAU

**Monthly / Weekly / Daily Active Users** — distinct individuals who
performed the qualifying action within the past 30 / 7 / 1 days.

These are the headline usage numbers we cite. They're standard enough that
funders, partners, and contributors will read them the same way we do.

### Activation

The point at which a User has done enough in the product to get value —
not the same as sign-up.

Activation is the test for "is this User actually using the product?"
For example, an Activated User on an outreach product might be one who has
logged at least three real client interactions across two separate days.

This matters because **sign-ups are a proxy metric**: they look like
adoption but don't predict it. Activation does.

### Retention (Day-N / Week-N)

The percentage of a cohort of Users who return on or after Day N (or Week N).

Standard reference points are **Day-1, Day-7, Day-30**. Retention is the
single most useful metric for distinguishing real adoption from a temporary
spike caused by a launch, training session, or top-down push.

### Churn

The percentage of Users (or Customers) who stop using the product within a
period.

We track both:

- **User churn** — individuals who stop using
- **Customer churn** — organizations that stop using or disengage

### Sign-up / NRU

**New Registered Users** — Users who created an account in a period.

We measure NRU but treat it as a **proxy metric**: meaningful only when
paired with Activation and Retention. NRU on its own is one of the metrics
that historically misled us.

---

## How to use this glossary

- When writing a decision check, prefer terms defined here over informal
  language ("active users" instead of "people using it").
- When introducing a new term, add it here first. If it can't be defined
  precisely, it probably shouldn't appear in a principle.
- Per-product specifics (qualifying action, window definitions) live with
  the product, not here. This file defines the term; the product defines
  the measurement.

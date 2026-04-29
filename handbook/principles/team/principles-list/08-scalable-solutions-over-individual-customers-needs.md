# 8. Scalable Solutions over Individual Customers' Needs

We design for the broader population of Customers, not just the ones in front of us.

- _Decision check:_ How will we test this against more than the requesting Customer before committing?

  1. 3+ independent Customers piloting it, or
  2. 1–2 Customers piloting it, plus a probe (interviews, prototype review, or a minimal test) with 3+ non-pilot Customers, or
  3. Independent validation from a domain expert or reference design.

  If the answer is "we'll figure it out as we go" or "it'll be obvious once we ship," the principle isn't met.

- _Decision check:_ Would this still be worth building if every Customer we're currently working with disappeared tomorrow? If no, it's single-fit.
- _Status:_ enforceable.

## Notes

- **Persona vs. Customer** — #8 and
  [#6 Focus over Coverage](./06-focus-over-coverage.md) are consistent
  once these are kept distinct:
  - **Persona = role** (Caseworker, Volunteer, Admin). #6 says narrow
    the role.
  - **Customer = organization** (a nonprofit org, a CoC). #8 says don't narrow
    the organization.
  - A feature should target **one Persona across many Customers** — not
    one Customer's specific Persona. See
    [terminology → Persona vs. Customer](../reference/terminology.md#persona-vs-customer).
- Piloting with friendly Customers is how we learn. Pilots aren't a
  violation as long as the pilot Customer is treated as a _sample_ — used
  to validate that the design generalizes — not as the _spec_ defining
  the requirements.
- We won't always get the design right, but we should be designing toward
  the larger population from the start, not retrofitting later.
- Single-Customer work isn't banned, but should be a deliberate exception
  (elevated by [context](../reference/context.md)) rather than a default.

## Open questions

- This principle has multiple decision checks. Are they all required, or
  does any one passing satisfy the principle? (Recommendation: both —
  each catches a different failure mode.)
- **Pilot methodology.** How many Customers — and chosen how — does it
  take to call a design "validated as generalizing"? We won't always have
  multiple friendly Customers available to pilot with. When we have only
  one, what compensating practices substitute (e.g., explicit population
  modeling, comparison to public data, structured interviews with
  non-pilot Customers)? The principle has to be testable even when the
  ideal sampling conditions don't hold.
- Should we require an explicit context note when this principle is
  overridden (e.g., to ship single-Customer work as a deliberate exception)?

## Origin

Related reflection assumptions:

- Shelter App 2.2 _— TBD:_ "we have to do this our way, from scratch, no collabs."
  - _Connection:_ This principle reframes the question. The issue isn't whether to collaborate, but whether what we build serves more than one Customer.

Related guiding questions:

- #9: "can this work with a partner?"
- #19: "does someone else already do this better?"

## Why this principle exists

This is a known repeated failure mode for the team: we build for the
Customer we can get on board, then discover the work doesn't transfer to
the next Customer. The decision checks above are deliberately strict
because the optimistic answer ("we can generalize it later") has cost us
multiple times. Treat overriding this principle as a deliberate choice,
not a side effect.

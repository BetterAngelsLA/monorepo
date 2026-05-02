# Scalable Solutions over Individual Customers' Needs

We design for the broader population of Customers, not just the ones in front of us.

## Decision checks

1. **Test beyond the requesting Customer.** How will we test this against more than the requesting Customer before committing?
   - 3+ independent Customers piloting it, or
   - 1–2 Customers piloting it, plus a probe (interviews, prototype review, or a minimal test) with 3+ non-pilot Customers, or
   - Independent validation from a domain expert or reference design.
   - If the answer is "we'll figure it out as we go" or "it'll be obvious once we ship," the principle isn't met.
2. **Counterfactual.** Would this still be worth building if every Customer we're currently working with disappeared tomorrow?
   - If no, it's single-fit.

## Why it exists

1. Building heavily for our principal Customer (SELAH) produced no measurable lift in adoption with other Customers — the work did not transfer. Single-Customer fit is not a stepping stone to multi-Customer fit; it is often a different product.
2. Each Customer comes with idiosyncratic needs, workflows, and stakeholders. Optimistic answers like "we'll generalize it later" have repeatedly translated into rewrites or abandoned features once the second Customer's reality hit.
3. Without this gate, the loudest Customer in the room defines the roadmap. That Customer is rarely representative of the broader population we exist to serve.
4. We have only finite engineering capacity. Work that serves one Customer's specific configuration is, by definition, work not spent on the broader population.
5. Single-Customer work isn't banned, but it must be a deliberate exception (see [context](../reference/context.md)), not an accidental default.

---

> **Review-stage notes.** Sections below are working notes for team review, not part of the principle itself. See [principle-format.md](../reference/principle-format.md#review-stage-sections-temporary).

## Notes

- **Persona vs. Customer** — this principle and the Focus check in
  [Evidence over Assumptions](./evidence-over-assumptions.md) are
  consistent once these are kept distinct:
  - **Persona = role** (Caseworker, Volunteer, Admin). The Focus check
    in Evidence over Assumptions says narrow the role.
  - **Customer = organization** (a nonprofit org, a CoC). This
    principle says don't narrow the organization.
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

## Origin reference

Related reflection assumptions:

- Shelter App 2.2 _— TBD:_ "we have to do this our way, from scratch, no collabs."
  - _Connection:_ This principle reframes the question. The issue isn't whether to collaborate, but whether what we build serves more than one Customer.

Related guiding questions:

- #9: "can this work with a partner?"
- #19: "does someone else already do this better?"

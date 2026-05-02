# Real Constraints over Ideal Design

We prioritize designs that work within external constraints over designs
that assume those constraints away.
Government systems, partner gatekeeping, and incentives are part of the design.

## Decision checks

1. **External constraint.** Name the external constraint that could block this. If you can't, you haven't looked.

## Why it exists

1. We have repeatedly designed as if external systems and gatekeepers would cooperate or be neutral, and they have not. Assumptions like "an external wouldn't be a blocker" and "external system access would be easy to get" were both invalidated, and each cost us substantial work that did not ship.
2. Government systems, partner organizations, funders, and incentive structures are not background noise — they shape what is actually buildable. Designs that assume them away produce work that cannot be deployed.
3. Constraints discovered late are the most expensive: they invalidate work already done. This principle forces them onto the table early, when the design can still adapt.
4. Without this principle, we default to designing for the world we wish existed rather than the one we operate in.

---

> **Review-stage notes.** Sections below are working notes for team review, not part of the principle itself. See [principle-format.md](../reference/principle-format.md#review-stage-sections-temporary).

## Open questions

- Where do we keep the running list of known external constraints (external system/org
  access or gatekeeping, funder reporting requirements, etc.)? Without
  a list, "name the constraint" relies on memory.
- Is this principle about _naming_ constraints or about _designing within_
  them? The current wording covers both; we may want to sharpen.

## Origin reference

Related reflection assumptions (Outreach App):

- 1.8 _— invalidated:_ "external org wouldn't be a blocker/enemy."
- 1.9 _— invalidated:_ "external org access would be easy to get."

Related guiding questions:

- #3: "right partner?"
- #21: "are there any government blockers?"

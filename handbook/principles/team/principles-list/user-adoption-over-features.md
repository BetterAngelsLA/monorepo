# User Adoption over Features

We prioritize sustained usage by **users** (individuals using the product)
over adding new features. Customer signing, leadership endorsement, and
training sessions do not count as adoption — only repeat user behavior does.

## Decision checks

1. **Adoption.** Will this materially increase **MAU** (with Day-30 retention) for the named persona in the next quarter?

## Why it exists

1. Customer signing, leadership endorsement, and training sessions have repeatedly **failed to predict actual usage**. We've paid the full cost of onboarding (in-person meetings, contracts, training) and seen zero adoption follow.
2. We've shipped feature-rich, polished versions of the Outreach App and seen no measurable lift in usage — features and UX polish alone do not produce adoption.
3. Without a usage-based check, every other measure of progress (signed Customers, completed integrations, positive feedback) can look healthy while the product is unused. This principle is the bottom-line test that protects against that drift.
4. If we can't defend a piece of work as moving repeat-user behavior, we are likely working on something that will not matter.

---

> **Review-stage notes.** Sections below are working notes for team review, not part of the principle itself. See [principle-format.md](../reference/principle-format.md#review-stage-sections-temporary).

## Open questions

- Is **MAU** the right cadence, or should we use **WAU**? MAU is more
  forgiving and a reasonable starting point, but WAU may be more honest for
  workflows used multiple times per week.
- What counts as a "qualifying action" per product? Each product needs to
  define this (see [terminology](../reference/terminology.md#active-user)).
- What does "materially" mean numerically? Should we set a minimum delta
  (e.g., +X% MAU) to avoid the check being satisfied by trivial gains?

## Origin reference

Related reflection assumptions (Outreach App):

- 1.4 _— invalidated:_ "top down approach would work. i.e., if an org could be convinced to sign on, its users would use it."
- 1.5 _— invalidated:_ "if you build it they will come."
- 1.6 _— invalidated:_ "more + better features = adoption."

Related guiding questions:

- #4: "will this increase adoption or just add another feature?"
- #11: "will this move the needle within a quarter?"
- #13: "are the actual users bought in?"

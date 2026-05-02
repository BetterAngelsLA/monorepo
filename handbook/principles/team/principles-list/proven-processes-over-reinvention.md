# Proven Processes over Reinvention

We prioritize building on processes that already work — manual or
automated, in our users' world or proven elsewhere — over inventing
new ones from scratch. Where a process already works, our job is
usually to scale it with tech, not replace it.

If a process doesn't exist anywhere yet, we are taking on two bets at
once: that the process is correct, and that users will adopt it. Pick
one.

## Decision checks

1. **Existing process.** Name the existing process this builds on.
   - It can be manual or automated, internal to our users or external.
   - "Users would want this" is not a process — it's a wish.
   - If you can't name one, you are inventing. Treat as the exception.
2. **Our role.** Name what we add to the existing process — speed, scale, accuracy, accessibility, reach.
   - If the answer is "we just rebuild it," reconsider. Someone is already doing it.

## Why it exists

1. When we invent a process from scratch, we are taking on **two bets at once**: that the process itself is correct, and that users will adopt it. We have a poor track record at both individually — doing them simultaneously compounds the risk.
2. Our highest-leverage validated work has been scaling existing manual processes (e.g., the data-entry pain documented in Outreach 1.1) — not inventing new behavior.
3. Where we have rejected collaboration and built our own version (Shelter App 2.2), we have repeatedly hit failure modes that other teams had already encountered and documented. We pay to re-learn what others already know.
4. Existing processes carry **proof of incentive**: someone is already doing it, which means the work is rewarded somehow. Invented processes have no such proof and frequently die at the adoption step (see [Evidence over Assumptions](./evidence-over-assumptions.md)).
5. This principle protects us from confusing "no one is doing this well" with "this is a real opportunity." Sometimes no one is doing it because no one needs it.

---

> **Review-stage notes.** Sections below are working notes for team review, not part of the principle itself. See [principle-format.md](../reference/principle-format.md#review-stage-sections-temporary).

## Notes

### Relationship to Evidence over Assumptions

- This principle is a _sourcing heuristic_ — where ideas come from.
- [Evidence over Assumptions](./evidence-over-assumptions.md) is the _evidence gate_ — whether to ship them.
- When they conflict, **Evidence over Assumptions wins.** A process proven elsewhere that our
  own users will not adopt is still a bad bet.

### What this principle protects against

- Inventing processes from scratch (Shelter App 2.2: "we have to do
  this our way, from scratch, no collabs").
- Building because _we_ think it would be useful, with no anchor in an
  existing process.
- Confusing "no one is doing this well" with "this is a real
  opportunity." Sometimes no one is doing it because no one needs it.

### Principle history

This principle was originally _Workflow Integration over Standalone
Tools_, framed around avoiding behavior change. It was reframed to
_Proven Processes over Reinvention_ because the deeper idea is
sourcing: ideas should come from processes that already work, not from
our own invention. The friction-of-a-new-tool concern is now covered
by the Incentive check in
[Evidence over Assumptions](./evidence-over-assumptions.md).

## Open questions

- How proven is proven? A process used by one team in one org is
  weaker evidence than one used across an industry. Should we grade
  the strength of the precedent?
- Are there cases where genuine invention is necessary (no existing
  process anywhere)? If so, how do we recognize them vs. wishful
  thinking?
- Where do we keep references to the proven processes we've identified
  (so future decisions can cite them rather than re-discover them)?

## Origin reference

Related reflection assumptions:

- Outreach App 1.1 _— validated:_ "outreach workers spend too much time on data entry." (An existing manual process — data entry — that tech could speed up.)
- Shelter App 2.2 _— TBD:_ "we have to do this our way, from scratch, no collabs."

Related guiding questions:

- #18: "can this be used in connection with service days?" (i.e., does it attach to an existing process)
- #19: "does someone else already do this better?"

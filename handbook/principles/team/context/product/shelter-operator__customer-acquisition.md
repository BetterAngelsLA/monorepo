Shelter-operator — Active Context

- Scope: Product (Shelter-operator)

- Situation Type: Product Phase — Customer Acquisition

  - The binding goal is landing the first shelters as active users —
    specifically, shelters using the app for booking and occupancy
    management. Development pace is a real constraint but not the
    framing: we don't have customers yet because the product isn't ready,
    not because we can't reach shelters.

- Principle Tradeoffs

  - Takes priority:
    - **Small Experiments over Large Builds.** Get the smallest
      viable version in front of one real shelter, used for actual
      booking and occupancy — not a demo or evaluation. Wins
      against multi-month builds toward a "complete" shelter
      management product.
    - **Proven Processes over Reinvention.** Tie data entry to a
      workflow shelters already do (booking) instead of asking them
      to maintain a separate dataset. Wins against any feature that
      would have shelters do new work just to populate our system.
    - **Evidence over Assumptions.** The "booking-as-source-of-truth"
      model is an unvalidated hypothesis. Work that produces real
      behavioral signal from a shelter using it daily wins against
      work based on assumed shelter workflows.
    - **User Adoption over Features.** A single shelter using the app
      daily for booking is the only adoption signal that matters
      under this context. Wins against breadth of features
      (reporting, multi-shelter admin) until that signal exists.
  - Takes lower priority:
    - **Scalable Solutions over Individual Customers' Needs.** Still
      applies, but yields under this context: we are intentionally
      designing for one shelter first, as a deliberate exception.
      Multi-shelter scale work is premature until the model is
      validated.
    - **Real Constraints over Ideal Design.** Still applies (the
      third-party development pace is a real external constraint),
      but the response is to take work in-house rather than
      redesigning around the constraint.

- Justification

  1. Zero shelters are using the app today. Evidence: the app is still
     in development, not in production with any shelter.
  2. The "shelters as source of truth via booking" hypothesis is
     unvalidated. Evidence: prior attempts to collect shelter data
     have failed because data goes stale; tying data entry to a
     workflow shelters are already doing (booking) is our bet, but no
     shelter has yet used the app this way.
  3. External development pace is a real risk to the first-shelter
     milestone. Evidence: the third party building this is on a 6-12
     month track for parts we need sooner; we have not yet decided
     which parts to take over in-house.
  4. Shelter-directory's usefulness depends on this product working.
     Evidence: live bed-availability — the feature that would make
     Shelter-directory genuinely valuable for both audiences — comes
     from shelters managing occupancy here. Until that loop closes,
     Shelter-directory remains data-constrained (see
     Shelter-directory context).

- Duration: Open — runs until exit criteria are met.

- Exit Criteria

  - At least 1 shelter actively using Shelter-operator for booking and
    occupancy in their daily workflow (not as a pilot/demo, but as their
    real booking system), AND
  - That shelter's occupancy data flowing through to Shelter-directory.
  - When both hit, re-evaluate: the next phase may be Customer
    Acquisition still (replicating to more shelters), or User Adoption
    (deeper usage within the first shelter), depending on what we learn.

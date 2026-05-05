Shelter-operator — Active Context

- Scope: Product (Shelter-operator)

- Situation Type: Product Phase — Customer Acquisition

  - What we're focused on under this context is landing the first
    shelters as active users — specifically, shelters using the app
    for booking and occupancy management. We pilot with a small
    number of shelters, but we build for all: Shelter-operator must
    be a multi-tenant product any shelter can adopt. Development
    pace is a real constraint but not the framing: we don't have
    customers yet because the product isn't ready, not because we
    can't reach shelters.

- Principle Tradeoffs

  Only principles whose default weighting changes under this context are
  listed. The others apply normally.

  - Takes priority:
    - **Scalable Solutions over Individual Customers' Needs.** With
      no shelters using the app yet, the gravitational pull during
      pilot will be to bend the product to whichever shelters are
      first. Resist that pull. Build a multi-tenant product any
      shelter can use; pilot with a few; do not let the pilot
      shelters' idiosyncratic workflows shape the core product. This
      wins against requests from the pilot shelters that don't
      generalize.

- Justification

  1. Zero shelters are using the app today. Evidence: the app is still
     in development, not in production with any shelter.
  2. The "shelters as source of truth via booking" hypothesis is
     unvalidated. Evidence: prior attempts (not necessarily by us) to collect shelter data
     have failed because data goes stale; tying data entry to a
     workflow shelters are already doing (booking) is our bet, but no
     shelter has yet used the app this way.
  3. Shelter-directory's usefulness depends on this product working.
     Evidence: live bed-availability — the feature that would make
     Shelter-directory genuinely valuable for both audiences — comes
     from shelters managing occupancy here. Until that loop closes,
     Shelter-directory remains data-constrained.

- Duration: Open — runs until exit criteria are met.

- Exit Criteria

  - At least 3–5 pilot shelters actively using Shelter-operator for
    booking and occupancy in their daily workflow (not as a
    pilot/demo, but as their real booking system), AND
  - Their occupancy data flowing through to Shelter-directory.
  - When both hit, re-evaluate: the next phase may be Customer
    Acquisition still (replicating to more shelters), or User Adoption
    (deeper usage within the pilot shelters), depending on what we
    learn.

Shelter-directory — Active Context

- Scope: Product (Shelter-directory)

- Situation Type: External Dependency

  - The directory's usefulness is gated by shelter data we don't control
    the inflow of: data the human data team enters manually, and data
    that will eventually flow from Shelter-operator (not yet live).
    Shelter-directory itself is a user-facing website; there is little
    we can do in this product to accelerate data acquisition.

- Principle Tradeoffs

  - Takes priority:
    - **Real Constraints over Ideal Design.** Data inflow is the
      external constraint. Design for the data we actually have, not
      the data we hope to have once Shelter-operator goes live or the
      data team scales.
    - **Evidence over Assumptions.** Add filters, schemas, and
      attribute coverage in response to behavioral signal from the
      audiences we have today (case-workers especially), not in
      anticipation. Filter complexity has been growing faster than
      data coverage.
    - **User Adoption over Features.** Of the two audiences,
      case-workers generate the higher-quality adoption signal
      (repeat searches on behalf of clients). Prefer features that
      lift case-worker MAU/retention over breadth aimed at
      hypothetical public users.
  - Takes lower priority:
    - **Scalable Solutions over Individual Customers' Needs.** Still
      applies, but yields when serving the human data team's
      throughput. They are an internal "customer of one," yet they
      are the binding rate on the product becoming useful — a
      deliberate exception under this context.
    - **Small Experiments over Large Builds.** Still in effect, but
      the binding question right now isn't "which experiment to run"
      — it's whether to build at all ahead of data. Wait-and-see is
      often the right call.

- Justification

  1. The directory is in production but not yet useful, because
     shelter coverage is sparse. Evidence: most filter combinations
     return empty or near-empty results; the directory is not yet
     publicly promoted.
  2. Data inflow has two paths and Shelter-directory controls neither.
     Evidence: the human data team enters records manually (slow by
     nature); Shelter-operator — the eventual self-service path — is
     still in development (see Shelter-operator context).
  3. We have been building feature breadth (schemas, filter UIs,
     attribute coverage) ahead of having data to populate it.
     Evidence: filters exist for attributes that few or no current
     records use; filter complexity has grown faster than data
     coverage.
  4. The two audiences have different needs and different leverage.
     Case-workers search repeatedly on behalf of clients and can see
     private records; public users search for themselves and see only
     public records. The recent public/private split is one example of
     audience-differentiated value extraction; we have not yet
     systematically explored what else is possible on this axis.

- Duration: Open — runs until exit criteria are met.

- Exit Criteria

  - Shelter coverage reaches a threshold where the directory is
    genuinely useful for both audiences (specific number TBD), AND
  - Either Shelter-operator is live and contributing live data, OR a
    sustainable manual data path is established with confidence the
    directory can stay current.
  - When both hit, re-evaluate whether the next phase is User Adoption
    (driving usage with the data we now have) or a different Product
    Phase.

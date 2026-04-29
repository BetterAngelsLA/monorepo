# 9. Aligned Incentives over Stated Needs

We prioritize features that align with an existing incentive a User is
already acting on over features that match what Users say they want.
Stated needs predict interest; incentives predict behavior.

- _Decision check:_ Name the specific incentive that rewards using this (time saved, required reporting, funding tied to it, compliance, recognition, avoided penalty). If the answer to "what happens if the User does not use this?" is "nothing," the incentive is too weak.
- _Status:_ enforceable.

## Notes

Categories of incentives to look for:

- **External** — funding requirements, reporting obligations, compliance.
- **Operational** — time saved, reduced workload, less friction.
- **Social** — recognition, avoiding blame, alignment with org norms.
- **Negative** — penalties, audits, required reporting.

If a feature maps to none of these, it will not be used consistently —
regardless of how much Users say they want it or how good the UX is.

Good vs. weak reasoning:

- _Weak:_ "Caseworkers want better data insights."
- _Better:_ "Caseworkers must submit reports weekly; missing data creates rework; this tool reduces reporting friction."
- _Strong:_ "Funding requires fields X, Y, Z; missing them blocks reimbursement; this tool ensures they're captured during the interaction."

What this principle forces:

1. No design based on stated preferences alone — interviews reveal what
   people say, not what they are rewarded to do.
2. No assumption of "rational usage" — usefulness does not equal adoption.
3. An explicit feature → incentive mapping for every feature.

## Open questions

- Where does the line sit between this and
  [#2 Validated Learning over Assumptions](./02-validated-learning-over-assumptions.md)?
  Proposed split: #2 requires evidence exists; #9 specifies that the
  evidence must describe an active incentive, not a stated preference.
  Worth confirming and cross-linking.
- Does an incentive need to already exist, or can a feature _create_ one
  (e.g., by exposing a metric leadership starts holding teams to)?
  Created incentives are real but slower and riskier — should the
  principle treat them differently?
- Should incentive strength be graded (e.g., "blocks pay" > "saves 10 min"
  > "social recognition"), or is binary present/absent enough?

## Origin

Related reflection assumptions:

- Outreach 1.2 _— TBD:_ "svc providers and governments want to understand their data" — true as a stated preference, but the source notes explicitly flag that "the desire for analytics is driven by incentives" (mostly funding). This principle captures that distinction.
- Outreach 1.5 _— invalidated:_ "if you build it they will come."
- Outreach 1.6 _— invalidated:_ "more + better features = adoption."
- Outreach 1.11 _— invalidated:_ "people would want everything we built."

Related guiding questions:

- #12: "is this user interested in tracking and improving outcomes?" — re-read as an incentive question rather than an outcome-metrics question.
- #13: "are the actual users bought in?" — buy-in here meaning incentive-aligned, not just stated agreement.

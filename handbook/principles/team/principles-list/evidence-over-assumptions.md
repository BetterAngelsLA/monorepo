# Evidence over Assumptions

We prioritize evidence from real usage over untested beliefs.
Unvalidated ideas are hypotheses, not strategy. What counts as evidence
is **observed behavior**, not stated preferences, excitement, or
agreement in meetings.

## Decision checks

1. **Focus.** Name the Persona(s) this is for and the specific problem it solves for each.
   - **Persona = role** (Caseworker, Volunteer, Admin), not organization. See [terminology → Persona vs. Customer](../reference/terminology.md#persona-vs-customer).
   - Most features serve **one Persona**. Multi-Persona features are valid when each Persona has a distinct, named role in the feature (e.g., a Caseworker submits, a Decision-maker reviews) — not when they're listed as a "who benefits" shopping list.
   - If you can't name a specific problem for each Persona, the feature is unfocused.
2. **Evidence.** Name the specific signal that supports this.
   - A signal can be data or observed user behavior — observed in our own users, or documented in a similar product or organization we can name.
   - **Stated preferences do not count.** This includes user complaints, interview quotes, internal requests, and "users said they want it." People say what they think they want; behavior shows what they actually do.
   - **Workarounds count as behavior.** If a user has built a manual workaround, that is a stronger signal than any number of complaints about the absence of one.
   - If you can't name behavioral evidence, it is an assumption.
3. **Value.** Name the concrete value this delivers to the User or Customer.
4. **Incentive.** Name the existing incentive that will drive the User to act.
   - An incentive is something already in the User's world — a reporting requirement, a funding tie, a workload pressure, a social norm — not one we hope to create.
   - If no existing incentive rewards acting on the value, expect adoption to stall.

## Why it exists

1. Two years of reflection across our apps showed that **most of our core assumptions were invalidated.** The common thread was that we acted on what people _said_ — in interviews, meetings, and leadership conversations — rather than on what they actually _did_.
2. Stated preferences ("yes, we'd use that," leadership endorsement, enthusiastic interview responses) repeatedly **failed to predict adoption**. Excitement in a meeting is not a signal.
3. Building for "everyone" or "users in general" produced features that fit no one well enough to drive usage. Without a named Persona and a named problem, the work is a shopping list, not a feature.
4. Without an existing incentive, even features that solve a real problem go unused — because nothing in the User's world rewards them for adopting it. We have shipped useful-on-paper features that died for exactly this reason.
5. This principle is the gate that prevents us from re-running the failure modes documented in our reflection on past work. Without it, we are deciding on opinion.

---

> **Review-stage notes.** Sections below are working notes for team review, not part of the principle itself. See [principle-format.md](../reference/principle-format.md#review-stage-sections-temporary).

## Notes

### Persona vs. Customer

The Focus check narrows the **Persona** (role), not the **Customer**
(organization). These two narrowings work in opposite directions and
must be kept distinct:

- **Persona = role** (Caseworker, Volunteer, Admin, Client). The Focus
  check above says narrow the role.
- **Customer = organization** (a nonprofit org, a CoC). [Scalable
  Solutions](./scalable-solutions-over-individual-customers-needs.md)
  says don't narrow the organization.

A correctly scoped feature targets **one Persona across many
Customers** — not one Customer's specific Persona. "Caseworkers at any
shelter" is right. "A specific nonprofit org's caseworkers" is
single-Customer work and triggers [Scalable Solutions](./scalable-solutions-over-individual-customers-needs.md).

### Behavior, not stated preference

Two years of reflection (see Origin) show that excitement, agreement in
meetings, and "yes, we'd use that" responses repeatedly failed to
predict adoption. Behavior — repeat usage, prior pilot retention, an
observable workaround the user has built without us — is what counts.

Second-hand behavioral evidence (a comparable org's published usage
data, an analogous product's documented retention) is acceptable when
named explicitly. Second-hand stated preferences are not.

### Why value (and the incentive behind it) is part of the evidence

Behavior persists when something rewards it. A one-time observed
action is not enough; we need to be able to name _why_ the user will
keep doing it — i.e., the incentive that sustains the behavior. Stated
needs predict interest; incentives predict behavior.

Categories of incentives to look for:

- **External** — funding requirements, reporting obligations, compliance.
- **Operational** — time saved, reduced workload, less friction.
- **Social** — recognition, avoiding blame, alignment with org norms.
- **Negative** — penalties, audits, required reporting.

If a feature maps to none of these, it will not be used consistently —
regardless of how much Users say they want it or how good the UX is.

### Good vs. weak reasoning

- _Weak:_ "Caseworkers want better data insights."
- _Better:_ "Caseworkers must submit reports weekly; missing data creates rework; this tool reduces reporting friction."
- _Strong:_ "Funding requires fields X, Y, Z; missing them blocks reimbursement; this tool ensures they're captured during the interaction."

### What this principle forces

1. No design based on stated preferences alone — interviews reveal what
   people say, not what they are rewarded to do.
2. No assumption of "rational usage" — usefulness does not equal adoption.
3. An explicit feature → incentive mapping for every feature.

### Principle history

This principle merges three earlier drafts (originally _Validated
Learning over Assumptions_, _Focus over Coverage_, and _Aligned
Incentives over Stated Needs_) and was renamed to _Evidence over
Assumptions_ to drop lean-startup jargon and match the language used
throughout the body. All three attacked closely related failure modes
— acting on what users say rather than what they do, and building for
"everyone" rather than a named role. The Focus check above absorbs
_Focus over Coverage_ in full; the Incentive check absorbs _Aligned
Incentives_. The incentive taxonomy from _Aligned Incentives_ is
preserved as the operational test for "what counts as behavioral
evidence."

## Open questions

- How do we handle decisions that genuinely have no prior signal — e.g., a
  net-new product idea? Is the answer always "run a small experiment first"
  (i.e., [Small Experiments over Large Builds](./small-experiments-over-large-builds.md)),
  or are there exceptions?
- Does an incentive need to already exist, or can a feature _create_ one
  (e.g., by exposing a metric leadership starts holding teams to)?
  Created incentives are real but slower and riskier — should the
  principle treat them differently?
- Should incentive strength be graded (e.g., "blocks pay" > "saves 10 min"
  > "social recognition"), or is binary present/absent enough?

## Origin reference

Related reflection assumptions:

- Outreach 1.2 _— TBD:_ "svc providers and governments want to understand their data."
- Outreach 1.5 _— invalidated:_ "if you build it they will come."
- Outreach 1.6 _— invalidated:_ "more + better features = adoption."
- Outreach 1.7 _— invalidated:_ "what it looked like mattered more than what it did." (Picked up from the dropped _Outcome Metrics_ draft: stated preferences about appearance do not predict adoption.)
- Outreach 1.10 _— invalidated:_ "external system/org access was the thing in the way of adoption."
- Outreach 1.11 _— invalidated:_ "people would want everything we built." (absorbed via the Focus check)
- Shelter App 2.1 _— TBD:_ "we just need data." (Picked up from the dropped _Outcome Metrics_ draft: data collection is not itself a value.)

Related guiding questions:

- #2: "right persona?" (Focus check)
- #7: "has this been proven / do we have reason to believe it'll work?" (Evidence check)
- #10: "does it help our core personas?" (Focus check)
- #12: "is this user interested in tracking and improving outcomes?" — re-read as an incentive question.
- #13: "are the actual users bought in?" — buy-in meaning incentive-aligned, not just stated agreement.
- #16: "what problem will this solve?" (Focus check)

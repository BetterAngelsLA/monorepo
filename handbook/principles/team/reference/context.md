Context (Definition)

Most decisions are made by principles alone. A context is only needed when
two principles conflict — it names our current focus so we know which
principle wins.

Purpose

Principles define how we make tradeoffs. They are durable and apply across the
whole team. But principles will sometimes point in different directions, and
when they do, we need a way to decide which one wins.

Context enables that decision. It names what we're focused on right now and
why — the conditions we're operating under and the goals that matter most
in this phase — and makes clear which principles should take priority while
that focus holds. Context is temporary and grounded in real, observable
signals: when the situation changes, the context changes with it.

Example: "Ship fast" and "Build for scale" are both principles. A product in
Customer Acquisition mode — where the goal is landing the first cohort of
partner orgs — elevates "Ship fast," because we need to learn what those orgs
actually need before investing in scale. Once we have a validated set of
customers, the context shifts and the balance does too.

Required Output

The output of a context is the Principle Tradeoffs it produces —
which principles take priority and which yield when they conflict. Everything
else in the schema (Situation Type, Justification) supports that output. A
context that doesn't produce clear tradeoffs hasn't done its job.

Rules

- Context does not override or invalidate principles. It only determines
  which principle takes precedence when two principles conflict. Every
  principle remains in effect under every context.
- Multiple contexts may be active at the same time, but they must not conflict.
  If two active contexts would elevate principles that point opposite directions,
  one must be resolved or retired before the other is added.
- When an Org-level context conflicts with a Product-level context, the
  Org-level context wins.
- Every context must have explicit exit criteria — an observable signal
  that would end it. If we can't say how we'll know it's over, it isn't a
  context — it's a worldview.
- Org-level context must additionally be time-bound, with a calendar
  deadline (not just a signal). Org context overrides Product context, so
  it needs the stronger guardrail. Permanent conditions belong in the
  principles, not in context.

Each context has:

- Scope (one of)

  - Product
    - Must specify which product
  - Org
    - Applies across all products
    - Must be time-bound

- Situation Type (what kind of situation this is)

  - Situation Type identifies the dominant driver of the context —
    lifecycle stage, external constraint, or internal initiative.
  - One of:
    - Product Phase — where the product is in its lifecycle
      - Customer Acquisition — we need more organizations adopting the product
      - User Adoption — we need increased usage by real end-users
      - Retention — we need existing users to keep using it
      - Scale — we need to grow usage without proportional effort
    - External Dependency — paced or blocked by a party outside our control
      - Examples: Partner integration, Regulatory approval, Government
        contract cycle
    - Temporary Initiative — an internally chosen, time-bound effort that
      interrupts normal priorities because something came up that warrants
      focused attention
      - Examples: Opportunistic project that pauses the roadmap, response
        to a competitor move, preparing for a board demo, addressing an
        unexpected problem
  - If a context fits more than one Situation Type, pick the one that is
    actually binding — the one that decides which principles win.
  - See "Other possible Situation Types" at the end of this document for
    additional categories that may apply.

- Principle Tradeoffs

  - This is the operative output of the context. State it before the
    justification below.
  - Takes priority: which principles are weighted highest under this
    context, and which other principles they should win against when they
    conflict.
  - Takes lower priority: which principles temporarily yield when they
    conflict with the above. They still apply — they just lose the
    tiebreak under this context.
  - Only list principles whose standard application changes under this
    context — either elevated above their default, or yielding when they
    normally would not. If a principle's normal application is unchanged,
    don't list it. Listing every principle dilutes the signal and risks
    implying the unlisted ones don't apply. The unlisted principles are
    still in full effect.

- Justification

  - The conditions, goals, and evidence that make the Principle Tradeoffs
    above the right call. Each item is a single claim (what's binding)
    paired with the signal that supports it.
  - Ordered highest priority first. Some items will be blockers; others
    will simply be the realities of the phase. Both are valid.
  - Each item is one sentence stating the claim, followed by the
    supporting signal (usage data, user feedback, failed pilot, etc.).
  - Examples of claims: "landing first 5 partner orgs," "learning which
    workflows fit real users," "no distribution channel," "blocked on
    external system/org access," "no validated workflow fit."
  - Guidelines:
    - Items must not conflict with each other within a single context.
    - Prefer fewer, sharper items over a long list. If you have more than
      3, you probably haven't identified the real binding ones.
    - Items must be observable, not aspirational. "Users don't return
      after first session" and "landing first 5 partner orgs" qualify;
      "we need better UX" does not.
    - Evidence, not opinion.

- Duration

  - Product scope: Open — runs until exit criteria are met.
  - Org scope: Time-bound — must have both a calendar deadline and exit
    criteria.

- Exit Criteria

  - The observable signal that ends this context.
  - Examples: "X active weekly users in workflow Y," "Z partner orgs signed,"
    "external system/org access granted."
  - Without this, the context will silently expire and get re-litigated.

Review Cadence

Context can change. We should have a pre-defined cadence to confirm an
active context still applies — otherwise it silently outlives its
relevance. Recommended cadence:

- Org-level contexts: reviewed monthly.
- Product-level contexts: reviewed at least quarterly.

---

Other possible Situation Types

These are not part of the core list, but may apply when the situation
genuinely doesn't fit one of the categories above. Use sparingly — if a
situation keeps showing up here, it probably belongs in the core list.

- Org Window — a time-bound organizational situation
  - Examples: Fundraise, Pre-audit, Leadership transition, Runway-constrained
- Capacity — a team-level condition shaping what's possible
  - Examples: Hiring freeze, Key person out, Onboarding-heavy quarter

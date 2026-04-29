Context (Definition)

Purpose
Context names the primary constraint currently limiting progress. It does not
replace principles — it determines which principles win when they conflict.
Principles are durable. Context is temporary.

Rules

- Multiple contexts may be active at the same time, but they must not conflict.
  If two active contexts would elevate principles that point opposite directions,
  one must be resolved or retired before the other is added.
- When an Org-level context conflicts with a Product-level context, the
  Org-level context wins.
- Org-level context must be time-bound. Permanent constraints belong in the
  principles, not in context.
- A context is only valid if it has explicit exit criteria. If we can't say how
  we'll know it's over, it isn't a context — it's a worldview.

Each context has:

- Scope (one of)

  - Product
    - Must specify which product
  - Org
    - Applies across all products
    - Must be time-bound

- Phase (where we are)

  - Phase is not itself a constraint, but it frames which constraints matter.
  - One of:
    - Customer Acquisition — we need more organizations adopting the product
    - User Adoption — we need increased usage by real end-users
    - Retention — we need existing users to keep using it
    - Scale — we need to grow usage without proportional effort

- Constraints

  - An ordered list (highest priority first) of the things currently limiting
    progress under this context.
  - Each constraint should be one sentence, naming a single specific blocker.
  - Examples: "no bottom-up user pull," "no distribution channel,"
    "blocked on external system/org access," "no validated workflow fit."
  - Guidelines:
    - Constraints must not conflict with each other within a single context.
    - Prefer fewer, sharper constraints over a long list. If you have more
      than 3, you probably haven't identified the real binding one.
    - Constraints should be observable, not aspirational. "Users don't
      return after first session" is a constraint; "we need better UX" is not.

- Reason

  - Why these are the binding constraints now (evidence, not opinion).
  - Reference the signal: usage data, user feedback, failed pilot, etc.

- Implications (optional but recommended)

  - Elevates: which principles are weighted highest under this context.
  - De-emphasizes: which principles are temporarily set aside.
  - Without this, the context informs but does not direct decisions.

- Duration

  - Open — until changed (Product scope only)
  - Time-bound — with a defined end date or condition (required for Org scope)

- Exit Criteria

  - The observable signal that ends this context.
  - Examples: "X active weekly users in workflow Y," "Z partner orgs signed,"
    "external system/org access granted."
  - Without this, the context will silently expire and get re-litigated.

- Review Cadence
  - Org-level: reviewed monthly.
  - Product-level: reviewed at least quarterly.

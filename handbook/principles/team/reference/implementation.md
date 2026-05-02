# Implementation

How we go from a draft set of principles to principles that actually
shape decisions — first within the Tech Team, then across BetterAngels.

> **Status: draft.** This file proposes the rollout. The principles
> themselves are not yet adopted.

## Goal

The principles succeed when:

1. The Tech Team **uses them by name** in real decisions — not in
   retros, not as decoration.
2. Leadership has **endorsed them** as how the Tech Team works, and
   treats overriding a principle as a deliberate, recorded act.
3. Decisions made under the principles are **measurably better** —
   fewer reversals, fewer stalled features, fewer projects that ship
   to no adoption.

## Review stage

Three activities, all running **in parallel**. They answer different
questions and don't depend on each other.

### 1. Tech Team review

The Tech Team reads the principles, asks questions, and proposes
revisions. Every team member gets a chance to push back.

### 2. Backtest against past decisions

A one-shot retrospective: re-test the principles against decisions
we've already made. The trial answers "do they help going forward?";
the backtest answers "would they have changed past outcomes — for
better or worse?"

Pick **5–8 past decisions** with known outcomes (mix of worked,
didn't, ambiguous). For each, record what the principles would have
said and classify the result: **would have helped**, **would have
wrongly blocked** (false positive), or **no effect**.

### 3. Trial period (4 weeks)

Use the principles on real, in-flight decisions for **four weeks**.
Every decision discussed in the team — scoping, prioritization,
partner conversations, internal requests — gets tested against the
principles by name. Log each decision and which principles it was
tested against; a shared note is enough.

A principle that never comes up, never helps, or generates only
false positives goes back to `candidates/` or is dropped.

## Adoption stage

Once the team agrees the review stage has produced a workable set,
we adopt them.

### 4. Adoption

The "draft" status comes off [`principles.md`](../principles.md).
The review-stage sections (`Notes`, `Open questions`, `Origin
reference`) are pruned. New decisions are **expected** to cite
principles; one that doesn't engage with them is incomplete.

### 5. Communication to leadership

We present the principles to Leadership and any other relevant teams
(Product, Operations). What we're asking for:

- **Acknowledge** the principles as how the Tech Team works.
- **Endorse** them — overrides are framed as **named context
  overrides** (recorded, time-boxed, with a stated reason), not
  one-off exceptions.
- **Hold themselves to the same bar.** Endorsing "evidence over
  assumptions" then making opinion-driven requests is empty
  endorsement.

What we are not asking for: veto power over priorities. The
principles say "if you want to override one, here is what that
costs and how it gets recorded" — not "Tech Team always wins."

### 6. Maintenance

- **Adding** — propose in [`candidates/`](../principles-list/candidates/),
  trial it, promote.
- **Removing** — if a principle hasn't been cited in real decisions
  for a quarter, decide whether to drop it. Unused principles are
  noise.
- **Context overrides** — track them. If we override the same
  principle for the same reason three times, add a named
  [context](./context.md) instead of overriding again.

## Failure modes

Three things that would make this work pointless.

1. **We say "adopted" but don't use them.** Quarterly check that
   principles are being cited in real decisions. Principles that
   aren't get pulled.
2. **We use them but they don't help.** Quarterly look at decisions
   made under the principles: did they catch something, or just
   block work that would have been fine? Track-record of false
   positives → revise; no track record at all → drop.
3. **Leadership endorses but ignores.** When a request would
   override a principle, the Tech Team names it explicitly and
   asks for a context override. Repeated unnamed overrides are
   tracked and surfaced as data, not conflict.

## Out of scope

- **Operations workflow** — how internal requests flow into the work
  queue, R&R, leadership-alignment cadence. See
  [`operations/principles.md`](../../operations/principles.md).
- **Per-principle decisions** — adding or removing a specific
  principle happens via [`candidates/`](../principles-list/candidates/),
  not here.

# Tech Team Principles — How to Use This

> **You're here because you're reviewing the draft principles.** This page
> tells you what to read, in what order, and what kind of feedback we're
> looking for.

The principles are still in **draft**. Nothing here has been adopted yet.
Your review is part of how they get adopted (or revised, or thrown out).

---

## What this is

A set of files that together define how the BetterAngels Tech Team makes
decisions:

- **The principles themselves** — durable rules like _Evidence over
  Assumptions_, _User Adoption over Features_.
- **Contexts** — temporary declarations of what we're focused on, used
  only when two principles conflict and we need a tiebreaker.
- **Reference docs** — the schemas, terminology, and review process that
  keep the above consistent.

You don't need to read every file. The path below is enough.

---

## Read these, in this order

Plan on ~30–45 minutes for a thorough first pass.

1. **[principles.md](./principles.md)** — start here. The entry point.
   Explains why principles exist, how to read them, and links to each
   principle and active context.
2. **The principles** (linked from `principles.md` under _The
   principles_) — read each one. They're short. Each lives in its own
   file under [principles-list/](./principles-list/) so it can be reviewed
   independently.
3. **[reference/context.md](./reference/context.md)** — what a context is
   and why it exists. Read this before the active contexts so the format
   makes sense.
4. **Active contexts** (linked from `principles.md` under _Active
   contexts_) — the real contexts currently in effect for our products.
5. **[reference/terminology.md](./reference/terminology.md)** — skim.
   Reach for it if a word in a principle ("User," "Customer," "Active
   User," "Persona") feels ambiguous. Several past mistakes came from
   reading these terms loosely.
6. **[reference/implementation.md](./reference/implementation.md)** —
   how we plan to roll the principles out: review stage (this), trial
   period, adoption, and what we'll be checking for to know it's
   working.

Optional, only if you want to go deeper:

- **[reference/principle-format.md](./reference/principle-format.md)** —
  the schema each principle follows. Useful if you want to propose a new
  principle or critique the format itself.
- **[reference/unmapped.md](./reference/unmapped.md)** — reflections
  that didn't become principles, with reasons.
- **[reference/source-notes.md](./reference/source-notes.md)** — where
  these principles came from.
- **[principles-list/candidates/](./principles-list/candidates/)** —
  proposed principles not yet in the main set.

---

## What we want from your review

Concretely, for each principle and active context, ask:

- **Is it true?** Does it match how we actually work, or how we
  should work?
- **Is it useful?** Would citing this principle have changed a real
  decision you remember? If not, why is it here?
- **Is it clear?** Could two people reading it independently apply it
  the same way? If not, where does it bend?
- **Is anything missing?** A tradeoff we make often that isn't
  captured here?

Per-principle working notes (`Notes`, `Open questions`, `Origin
reference`) at the bottom of each principle file exist specifically for
review-stage feedback. They'll be pruned once principles are adopted —
don't worry about preserving them.

## How to give feedback

Add comments inline, open issues against the files, or bring items to
the next Tech Team review. Disagreement is the point — a principle that
nobody pushes on probably isn't doing any work.

## What happens next

After the team review, we run a 4-week trial using the principles on
real, in-flight decisions, and a one-shot backtest against past
decisions. Principles that don't help — or generate false positives —
get revised or dropped before adoption. The full plan is in
[reference/implementation.md](./reference/implementation.md).

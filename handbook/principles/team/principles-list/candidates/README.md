# Candidate Principles

A proving ground for principles under consideration. Candidates here are
**not yet adopted** — they are being stress-tested against real decisions
before being promoted to [`principles-list/`](../).

## Why this exists

A principle should not enter the active list until it has earned team
consensus by surviving real use. Candidates let us trial wording, decision
checks, and edge cases without polluting the canonical list or weakening
the bar for what "principle" means.

## What belongs here

A candidate must already meet the format rules in
[`principle-format.md`](../../reference/principle-format.md):

- A real X-over-Y where both sides are defensible.
- A one-sentence, unhedged explanation.
- A concretely answerable decision check.

Ideas that don't meet that bar are not candidates — they are notes. Keep
them somewhere else (a doc, an issue, a conversation) until they do.

## How candidates differ from adopted principles

- **Wording is mutable.** The "principles are immutable" rule in
  [`principle-format.md`](../../reference/principle-format.md) does not
  apply here. The point of the trial period is to revise.
- **Cite them, don't gate on them.** A candidate can be referenced in a
  decision discussion ("this looks like it would fail candidate X"), but
  it cannot block a decision the way an adopted principle can.
- **They expire.** A candidate that has not been cited against a real
  decision within the trial window is either redundant with an existing
  principle or not load-bearing. Cut it.

## Lifecycle

1. **Propose** — add a file here following the format rules. Use a descriptive filename (the title slug).
2. **Trial** — cite it against real decisions. Note where it held up,
   where it didn't, and revise wording as needed.
3. **Promote or drop** — at a named team review, either:
   - Promote to [`principles-list/`](../) by moving the file up one level (filename = title slug); update any cross-references.
   - Or drop it and delete the file.

Candidates are not archived. If something gets dropped and resurfaces
later, it can be re-proposed from scratch.

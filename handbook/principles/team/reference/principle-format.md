# Principle Format

How each principle in [`principles.md`](../principles.md) is written.

## Purpose

- **Consistency** — every decision can be tested against the same set of principles.
- **Accountability** — decisions are made against defined tradeoffs, not opinions.
- **Force tradeoffs** — surface conflict instead of hiding it.

## Schema

A principle consists of these fields. **All are required.** Anything else is not part of the principle.

| Field              | Description                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Title**          | In the form `X over Y`. Used as the canonical reference to the principle.                                                                              |
| **Explanation**    | One sentence that says _why_ X beats Y.                                                                                                                |
| **Decision check** | Numbered list. Concrete question(s) that can be answered yes/no or with a specific value.                                                              |
| **Why it exists**  | Numbered list. The failure mode this principle prevents and the pain that made it necessary. This is what defends the principle when it is challenged. |

## Rules

- The title must be in the form `X over Y`. Both X and Y must be defensible choices.
- Principle files are named after the title slug (`x-over-y.md`), not numbered. The list of principles is unordered — numbering would imply priority, and principles apply together rather than in sequence.
- The explanation must not hedge ("X over Y, except when...").
- The explanation is one sentence.
- The decision check must be concretely answerable (yes/no, a number, a named persona, a date) — not another open-ended question. The answer must clearly indicate pass or fail of the principle. If we can't write one, the principle isn't clear enough yet.
- Principles are immutable. They are added or removed, not edited. If circumstances change, name a [context](./context.md) — context is the thing that changes.
- Principles must be clear enough to apply today and have earned team consensus through real use. Ideas that aren't ready yet do not belong in [`principles-list/`](../principles-list/) — park them in [`principles-list/candidates/`](../principles-list/candidates/) until they are.
- **Why it exists** must be concrete — name the failure mode, the cost, or the past assumption that turned out to be wrong. Generic appeals ("good engineering practice," "industry best practice") do not defend a principle and do not belong here.

## Section order

Within each principle file, the schema sections appear in this order:

1. Title + explanation (file header)
2. `## Decision checks`
3. `## Why it exists`

## Review-stage sections (temporary)

While the principles are being evaluated by the team, each file may also contain working-notes sections that are **not part of the principle itself**. These live below the schema sections, separated by a horizontal rule (`---`) and a callout marking them as review-stage material.

Common review-stage sections include:

- `## Notes` — caveats, related failure modes, common misreadings, principle history (merges, renames).
- `## Open questions` — things still being worked out about how to apply or sharpen the principle.
- `## Origin reference` — references to the offsite reflection material the principle was drawn from.

These sections are expected to be removed (or pruned heavily) once principles are fully adopted. They exist to help the team review and refine the principle, not to define it.

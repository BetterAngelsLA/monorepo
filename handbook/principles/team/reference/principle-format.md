# Principle Format

How each principle in [`principles.md`](../principles.md) is written.

## Purpose

- **Consistency** — every decision can be tested against the same set of principles.
- **Accountability** — decisions are made against defined tradeoffs, not opinions.
- **Force tradeoffs** — surface conflict instead of hiding it.

## Schema

Each principle has:

| Field                | Required | Description                                                                                                            |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Title**            | yes      | Short name, usually the X-over-Y restated as a noun phrase.                                                            |
| **Value preference** | yes      | A single line in the form `X over Y`.                                                                                  |
| **Explanation**      | yes      | One sentence that says _why_ X beats Y.                                                                                |
| **Decision check**   | yes      | A concrete question(s) that can be answered yes/no or with a specific value.                                           |
| **Status**           | yes      | One of `enforceable`, `aspirational`, or `deprecated`. See [Status](#status) below.                                    |
| **Notes**            | no       | Supplemental context: caveats, common misreadings, related failure modes. Not required reading to apply the principle. |

## Rules

- Both X and Y must be defensible choices.
- The explanation must not hedge ("X over Y, except when...").
- The explanation is one sentence. Anything longer belongs in **Notes**.
- The decision check must be concretely answerable (yes/no, a number, a named persona, a date) — not another open-ended question. The answer must clearly indicate pass or fail of the principle. If we can't write one, the principle isn't clear enough yet.
- Principles are immutable. They are added or removed, not edited. If circumstances change, name a [context](./context.md) — context is the thing that changes.

## Status

A principle's **status** declares whether it can be enforced today. The principle itself is not weakened by status — only its application is.

- **enforceable** — the principle can be tested against real decisions today. The decision check resolves to a clear pass/fail. This is the default.
- **aspirational** — the principle is true and accepted, but cannot currently fail a decision because the supporting infrastructure (metrics, definitions, tooling) does not yet exist. Decisions made under an aspirational principle should still cite it directionally, but it is not a gate. Aspirational principles must name what would make them enforceable, tracked as a follow-up.
- **deprecated** — the principle no longer applies. Kept in the list for history; not used in current decisions.

Do not weaken a principle's wording to make it enforceable. Mark it `aspirational` instead and fix the gap.

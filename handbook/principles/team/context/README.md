Active Contexts

This directory holds the actual contexts in effect — the runtime state of the
principles system. The schema and rules for what a valid context looks like
live in [reference/context.md](../reference/context.md). This README is the
index.

Structure

- `org/` — Org-level contexts. Apply across all products. Override Product
  contexts when they conflict. Reviewed monthly.
- `product/` — Product-level contexts. One file per product. Reviewed at
  least quarterly.
- `archive/` — Retired contexts, preserved as institutional record. Mirrors
  the `org/` and `product/` structure.

Conventions

- One file per context.
- Each file follows the schema defined in
  [reference/context.md](../reference/context.md). No free-form prose.
- Filename for active Product contexts: `<product-slug>__<context-slug>.md`
  (e.g. `outreach-app__customer-acquisition.md`,
  `betterangels__lahsa-api-dependency.md`). The double underscore separates
  the product from a short slug describing the specific context, since a
  product can have more than one active context (e.g. a Product Phase plus
  a Temporary Initiative).
- Filename for active Org contexts: include a period identifier
  (e.g. `2026-h1-fundraise.md`).
- If a single product accumulates 3+ active contexts, consider promoting it
  to a subdirectory (`product/<slug>/...`) — and ask whether that many
  contexts are actually binding.
- When a context retires (exit criteria met, or replaced):
  1. Append a "Retired" section to the file noting the date and outcome.
  2. Move the file to the matching `archive/` subdirectory.
  3. A retired context is never edited again. If the situation recurs,
     write a new one and reference the old.

Active Contexts (Index)

Update this list whenever a context is added, retired, or materially changed.

Org-level

- _(none active)_

Product-level

- [Outreach App — Customer Acquisition](product/outreach-app__customer-acquisition.md)
- [Shelter-directory — External Dependency](product/shelter-directory__external-dependency.md)
- [Shelter-operator — Customer Acquisition](product/shelter-operator__customer-acquisition.md)

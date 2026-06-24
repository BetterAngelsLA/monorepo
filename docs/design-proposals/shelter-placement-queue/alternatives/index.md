# Alternatives Considered

Four architectures were evaluated for client-to-shelter matching in the placement queue.

| Option | Summary | Verdict |
|---|---|---|
| [1 — Direct Query](./1-direct-query.md) | Map client fields to shelter M2M filters in a Python function. No new models. | Simple but rigid |
| [2 — Dual M2M](./2-dual-m2m.md) | `EligibilityCriterion` M2M on both Referral and Shelter. Matching via M2M intersection. | Complex; sync issues |
| [3 — Referral Only ✅](./3-referral-only.md) | `EligibilityCriterion` M2M on Referral only. Shelters queried via existing M2Ms + lookup dict. | **Selected** — best balance |
| [4 — JSON Field](./4-json-field.md) | Criteria stored as a JSON list on Referral. No new model. | Fragile; no referential integrity |

## Selection Criteria

| | Model count | Sync needed | Match efficiency | Data integrity | Overall |
|---|---|---|---|---|---|
| Option 1 | 0 | No | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Simple but rigid |
| Option 2 | 1 | Yes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Complex |
| **Option 3** | **1** | **No** | **⭐⭐⭐** | **⭐⭐⭐⭐⭐** | **Best balance** |
| Option 4 | 0 | No | ⭐⭐⭐ | ⭐⭐ | Fragile |

# Alternatives Considered: Shelter Placement Queue

## Evaluated Approaches

Four architectures were evaluated for client-to-shelter matching.

---

### Option 1: Direct Query — No New Models

```
Client fields → Python function with if/else → Shelter M2M filters
```

Map client fields to shelter M2M filters inside a Python function. No new database models.

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐⭐⭐⭐ | Zero new models, zero migration |
| Maintainability | ⭐⭐ | Every new matching rule = code change + deploy |
| Query efficiency | ⭐⭐⭐ | Multi-table OR joins |
| Cross-app reuse | ⭐⭐ | Callers must import the Python function |
| Auditability | ⭐ | Can't see "what matched" without running code |
| Data integrity | ⭐⭐⭐⭐⭐ | Source fields are the truth — no sync needed |

**Rejected because:** The mapping function is opaque, hard to audit, and requires code deploys for rule changes. Does not scale as matching criteria grow.

---

### Option 2: Unified M2M on Both Sides

```
EligibilityCriterion ──M2M──► Referral (criteria at creation)
EligibilityCriterion ──M2M──► Shelter (synced from existing M2Ms)
```

Both ClientProfile/Referral AND Shelter get an M2M to `EligibilityCriterion`. Matching is a simple M2M intersection.

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐ | New model + 2 M2Ms + derivation + sync signal + backfill |
| Maintainability | ⭐⭐⭐⭐ | Add criteria in admin. No code deploy. |
| Query efficiency | ⭐⭐⭐⭐⭐ | Single M2M intersection |
| Cross-app reuse | ⭐⭐⭐⭐⭐ | Shared vocabulary via GraphQL/Django ORM |
| Auditability | ⭐⭐⭐⭐ | Referral shows criteria at creation time |
| Data integrity | ⭐⭐⭐ | Shelter sync must be maintained. Two sources of truth to reconcile. |

**Rejected because:** Requires a sync signal between shelter existing M2Ms and the new `EligibilityCriterion` M2M. Backfill needed. Ongoing reconciliation risk. Higher complexity than warranted.

---

### Option 3: Criteria on Referral Only ✅ SELECTED

```
EligibilityCriterion ──M2M──► Referral only
Shelter queried via existing M2Ms + lookup dict
```

Criteria are on the Referral only. Shelters use their own existing M2Ms queried via a lookup dict. One M2M, no sync.

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐⭐⭐ | New model + 1 M2M. No shelter sync. |
| Maintainability | ⭐⭐⭐⭐ | Add criteria in admin + 1 line to lookup dict |
| Query efficiency | ⭐⭐⭐ | One OR query per criterion. Acceptable. |
| Cross-app reuse | ⭐⭐⭐⭐ | Criteria vocabulary reusable across apps |
| Auditability | ⭐⭐⭐⭐⭐ | Referral has criteria. Shelter uses own M2Ms. |
| Data integrity | ⭐⭐⭐⭐⭐ | Zero sync. Shelters manage their own M2Ms. |

**Selected because:** Best balance of simplicity, maintainability, and data integrity. No sync issues. Shelters own their data. The lookup dict is configuration, not logic.

---

### Option 4: JSON Field on Referral

```
Referral.criteria_json = ["senior", "veteran", ...]
```

Store criteria as a JSON list on the Referral. No foreign keys, no new model.

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐⭐⭐⭐ | One JSON field on Referral |
| Maintainability | ⭐⭐ | JSON blob. No referential integrity. |
| Query efficiency | ⭐⭐⭐ | Same OR query pattern as Option 3 |
| Cross-app reuse | ⭐ | No shared vocabulary. Strings everywhere. |
| Auditability | ⭐⭐ | Can't query "how many referrals have veteran criterion?" |
| Data integrity | ⭐⭐ | "veteran" vs "Veteran" vs "veterans" — string typos break silently |

**Rejected because:** No referential integrity. String-based matching is fragile. Not suitable for anything beyond a prototype.

---

## Summary

| | Model count | Sync needed | Match efficiency | Data integrity | Score |
|---|---|---|---|---|---|
| Option 1: Direct query | 0 | No | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Simple but rigid |
| Option 2: Dual M2M | 1 | Yes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Complex |
| **Option 3: Referral-only** | **1** | **No** | **⭐⭐⭐** | **⭐⭐⭐⭐⭐** | **Best balance** |
| Option 4: JSON field | 0 | No | ⭐⭐⭐ | ⭐⭐ | Fragile |

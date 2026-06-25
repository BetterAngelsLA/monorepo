# Rejected Alternatives

Four architectures were evaluated for client-to-shelter matching before selecting [Option 3](./proposal.md).

---

## Option 1: Direct Query — No New Models

Map client fields to shelter M2M filters in a Python function. No new database models.

```python
def get_matching_shelters(client):
    q = Q()
    if client.gender == FEMALE and client.age and client.age >= 18:
        q |= Q(demographics__name="single_women")
    if client.age and client.age >= 55:
        q |= Q(demographics__name="seniors")
    if client.veteran_status == YES:
        q |= Q(special_situation_restrictions__name="veterans")
    # ... 10+ more rules
    return Shelter.objects.filter(q).distinct()
```

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐⭐⭐⭐ | Zero new models, zero migration |
| Maintainability | ⭐⭐ | Every new rule = code change + deploy |
| Query efficiency | ⭐⭐⭐ | Multi-table OR joins |
| Cross-app reuse | ⭐⭐ | Callers must import the Python function |
| Auditability | ⭐ | Can't see "what matched" without running code |
| Data integrity | ⭐⭐⭐⭐⭐ | Source fields are the truth |

**Rejected:** Opaque, hard to audit, requires deploys for rule changes.

---

## Option 2: Dual M2M — Criteria on Both Referral and Shelter

`EligibilityCriterion` M2M on both sides. Matching via simple M2M intersection.

```
EligibilityCriterion ──M2M──► Referral
EligibilityCriterion ──M2M──► Shelter (synced from existing M2Ms)
```

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐ | New model + 2 M2Ms + derivation + sync signal + backfill |
| Maintainability | ⭐⭐⭐⭐ | Add criteria in admin. No code deploy. |
| Query efficiency | ⭐⭐⭐⭐⭐ | Single M2M intersection |
| Auditability | ⭐⭐⭐⭐ | Referral shows criteria at creation |
| Data integrity | ⭐⭐⭐ | Shelter sync must be maintained. Risk of drift. |

**Rejected:** Requires sync signal between shelter existing M2Ms and new criteria M2M. Backfill needed. Ongoing reconciliation risk.

---

## Option 3: Criteria on Referral Only ✅ SELECTED

`EligibilityCriterion` M2M on Referral only. Shelters queried via existing M2Ms using a lookup dict.

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐⭐⭐ | New model + 1 M2M. No shelter sync. |
| Maintainability | ⭐⭐⭐⭐ | Add criteria in admin + 1 line to dict |
| Query efficiency | ⭐⭐⭐ | OR query per criterion. Optimizable later. |
| Auditability | ⭐⭐⭐⭐⭐ | Referral has FK'd criteria. Shelter owns M2Ms. |
| Data integrity | ⭐⭐⭐⭐⭐ | Zero sync. Shelters manage their own M2Ms. |

**Selected.** Best balance. No sync. Shelters own their data. See [proposal.md](./proposal.md).

---

## Option 4: JSON Field on Referral

Store criteria as a JSON list. No new model, no foreign keys.

```
Referral.criteria_json = ["senior", "veteran", "family"]
```

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐⭐⭐⭐ | One JSON field on Referral |
| Maintainability | ⭐⭐ | No referential integrity. Can't query across referrals. |
| Query efficiency | ⭐⭐⭐ | Same OR pattern as Option 3 |
| Cross-app reuse | ⭐ | No shared vocabulary. Strings everywhere. |
| Data integrity | ⭐⭐ | "veteran" vs "Veteran" — typos break silently |

**Rejected:** No referential integrity. String typos break silently. Data migration from JSON to FK later is more work than doing it right the first time.

---

## Summary

| Option | Models | Sync? | Match perf | Data integrity | Verdict |
|---|---|---|---|---|---|
| 1: Direct query | 0 | No | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Rigid |
| 2: Dual M2M | 1 | Yes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Complex |
| **3: Referral only** | **1** | **No** | **⭐⭐⭐** | **⭐⭐⭐⭐⭐** | **Selected** |
| 4: JSON field | 0 | No | ⭐⭐⭐ | ⭐⭐ | Fragile |

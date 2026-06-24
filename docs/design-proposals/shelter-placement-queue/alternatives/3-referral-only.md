# Option 3: Criteria on Referral Only ✅ SELECTED

## Approach

`EligibilityCriterion` M2M lives on the Referral only. Shelters are matched using their *existing* M2Ms (demographics, accessibility, special_situations, pets, etc.) queried via a simple lookup dict.

```
EligibilityCriterion ──M2M──► Referral only
Shelter queried via existing M2Ms + CRITERION_MAPPING lookup dict
```

```python
# One M2M, no shelter sync
# Derivation runs once at referral creation
def derive_criteria(client):
    criteria = set()
    if client.veteran_status == YES: criteria.add("veteran")
    if client.age >= 55:            criteria.add("senior")
    # ...
    return criteria

# Matching: lookup dict maps criterion → shelter M2M filter
CRITERION_MAPPING = {
    "veteran":  {"special_situation_restrictions__name": "veterans"},
    "senior":   {"demographics__name": "seniors"},
    # ...
}

def get_matching_shelters(referral):
    q = Q()
    for c in referral.criteria.all():
        kwargs = CRITERION_MAPPING.get(c.name)
        if kwargs: q |= Q(**kwargs)
    return Shelter.objects.filter(q).distinct()
```

## Evaluation

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐⭐⭐ | New model + 1 M2M. No shelter sync. No backfill. |
| Maintainability | ⭐⭐⭐⭐ | Add criteria in admin + 1 line to lookup dict. Lookup dict is configuration, not logic. |
| Query efficiency | ⭐⭐⭐ | One OR query per criterion. Acceptable for current queue size. Room to optimize later. |
| Cross-app reuse | ⭐⭐⭐⭐ | Criteria vocabulary reusable across apps via shared model. |
| Auditability | ⭐⭐⭐⭐⭐ | Referral has FK'd criteria. Shelter uses own M2Ms as source of truth. No reconciliation needed. |
| Data integrity | ⭐⭐⭐⭐⭐ | Zero sync. Shelters manage their own M2Ms. Criteria are frozen snapshots at referral time. |

## Why Selected

- **No sync** — The biggest risk of Option 2 is eliminated. Shelters own their data.
- **Shelters own their data** — Their M2Ms (demographics, accessibility, etc.) are already maintained. No duplication.
- **Shared vocabulary** — `EligibilityCriterion` gives us a canonical list of what can be matched on.
- **Auditable** — Referrals have real FK'd criteria, not loose strings.
- **One derivation point** — `derive_criteria(client)` runs once at referral creation. No signals needed.
- **The lookup dict** — Not a mapping *function*. Just data. Can be promoted to a database table (`CriterionShelterMapping`) if we want admin-editable mappings later — zero code change to the matching engine.

# Option 4: JSON Field on Referral

## Approach

Store criteria as a JSON list directly on the Referral model. No new model, no foreign keys.

```
Referral.criteria_json = ["senior", "veteran", "family", "wheelchair_user"]
```

```python
# Derivation produces a list of strings
criteria_list = ["senior", "veteran", "family", "wheelchair_user"]
referral.criteria_json = criteria_list

# Matching parses the JSON
def get_matching_shelters(referral):
    q = Q()
    for name in referral.criteria_json:
        kwargs = CRITERION_MAPPING.get(name)
        if kwargs: q |= Q(**kwargs)
    return Shelter.objects.filter(q).distinct()
```

## Evaluation

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐⭐⭐⭐ | One JSON field on Referral. No new model. Fastest to implement. |
| Maintainability | ⭐⭐ | JSON blob has no referential integrity. Can't query "how many referrals use veteran criterion?" without parsing. |
| Query efficiency | ⭐⭐⭐ | Same OR query pattern as Option 3. |
| Cross-app reuse | ⭐ | No shared vocabulary model. Strings duplicated across codebase. |
| Auditability | ⭐⭐ | Can't join against criteria. Must parse JSON for every query. |
| Data integrity | ⭐⭐ | String typos break silently: "veteran" vs "Veteran" vs "veterans". No database-level validation. |

## Verdict

**Rejected.** No referential integrity. String-based matching is fragile and prone to silent failures. Not suitable for anything beyond a prototype. Adding a proper model later would require data migration from JSON to FK — more work than just doing it right the first time.

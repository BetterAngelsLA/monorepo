# Option 1: Direct Query — No New Models

## Approach

Map client fields to shelter M2M filters inside a Python function. No new database models.

```
Client fields → Python function with if/else → Shelter M2M filters
```

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

## Evaluation

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐⭐⭐⭐ | Zero new models, zero migration |
| Maintainability | ⭐⭐ | Every new matching rule = code change + deploy |
| Query efficiency | ⭐⭐⭐ | Multi-table OR joins. Acceptable at this scale. |
| Cross-app reuse | ⭐⭐ | Callers must import the Python function |
| Auditability | ⭐ | Can't see "what matched" without running code. No record of what criteria were used. |
| Data integrity | ⭐⭐⭐⭐⭐ | Source fields are the single source of truth — no sync needed |

## Verdict

**Rejected.** The mapping function is opaque, hard to audit, and requires code deploys for every rule change. Does not scale as matching criteria grow. The function itself is the thing the team wanted to avoid — criteria are implicit in if/else logic rather than explicit data.

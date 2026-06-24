# Option 2: Dual M2M — `EligibilityCriterion` on Both Sides

## Approach

Both the Referral AND the Shelter get an M2M to `EligibilityCriterion`. Matching is a clean M2M intersection query.

```
EligibilityCriterion ──M2M──► Referral (criteria frozen at creation)
EligibilityCriterion ──M2M──► Shelter (synced from existing M2Ms via signal)
```

```python
# Matching becomes dead simple
compatible_shelters = Shelter.objects.filter(
    accepted_criteria__in=referral.criteria.all()
).distinct()
```

## Evaluation

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | ⭐⭐ | New model + 2 M2Ms + derivation function + sync signal + backfill management command |
| Maintainability | ⭐⭐⭐⭐ | Add criteria in Django admin. No code deploy for new rules. |
| Query efficiency | ⭐⭐⭐⭐⭐ | Single M2M intersection. Fastest approach. |
| Cross-app reuse | ⭐⭐⭐⭐⭐ | Shared vocabulary available via GraphQL and Django ORM |
| Auditability | ⭐⭐⭐⭐ | Referral shows criteria at creation time. Shelter shows what it accepts. |
| Data integrity | ⭐⭐⭐ | Shelter sync must be maintained. Two sources of truth (existing M2Ms + criteria M2M) that can drift. |

## Why Rejected

The shelter side requires:

1. **A sync signal** — When a shelter updates `demographics`, a signal must also update `accepted_criteria` to match. This is fragile.
2. **A backfill command** — Existing shelters need their criteria populated from their existing M2Ms.
3. **Ongoing reconciliation** — Over time, the two M2Ms can drift (direct DB edits, import scripts, admin actions that bypass signals). Must monitor and repair.

This is higher complexity than the problem warrants. Shelters already have well-maintained M2Ms — duplicating that information creates a maintenance burden with no clear benefit over Option 3.

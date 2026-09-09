# Rejected Alternatives

Five architectures were evaluated for client-to-shelter matching before selecting
[Option 3](./proposal.md) (frozen boolean fields + direct matching function).

---

## Option 1: Live Direct Query — No New Models

Query shelters directly from live `ClientProfile` fields at query time. No new
database models, no frozen state.

```python
def get_matching_shelters(client):
    q = Q()
    if client.gender == FEMALE and client.age and client.age >= 18:
        q |= Q(demographics__name="single_women")
    if client.age and client.age >= 55:
        q |= Q(demographics__name="seniors")
    if client.veteran_status == YES:
        q |= Q(special_situation_restrictions__name="veterans")
    return Shelter.objects.filter(q).distinct()
```

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | 5/5 | Zero new models, zero migration |
| Maintainability | 2/5 | Every new rule = code change + deploy |
| Auditability | 1/5 | Can't see "what matched" without running code |
| Data integrity | 5/5 | Source fields are the truth |

**Rejected:** Not auditable. If a client profile changes, historical referrals
silently change their matching behavior. Frozen attributes solve this.

---

## Option 2: Dual M2M — Criteria on Both Referral and Shelter

A shared `EligibilityCriterion` model with M2Ms on both sides.

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | 2/5 | New model + 2 M2Ms + derivation + sync signal + backfill |
| Maintainability | 4/5 | Add criteria in admin. No code deploy. |
| Data integrity | 3/5 | Shelter sync must be maintained. Risk of drift. |

**Rejected:** Requires sync signal between shelter existing M2Ms and new criteria
M2M. Backfill needed. Duplicating shelter M2Ms into a parallel model creates
maintenance burden.

---

## Option 3: Frozen Boolean Fields + Direct Matching (SELECTED)

Client attributes are derived once at referral creation and frozen as concrete
`BooleanField` columns on `Referral`. Matching queries Shelter M2Ms directly
from a Python function. Manual-only tags use a `JSONField`.

See [proposal.md](./proposal.md) for the full design.

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | 4/5 | 8 boolean fields + 1 JSONField. No new config tables. |
| Maintainability | 4/5 | Add attribute = migration + 2-3 lines of Python. |
| Auditability | 5/5 | Every attribute is a named database column. |
| Data integrity | 5/5 | Boolean columns are type-checked. Shelter M2Ms are the source of truth. |
| Django ecosystem fit | 5/5 | Follows the consensus pattern for <=15 stable attributes. |

**Selected.** Best balance. No sync, no config tables, no stringly-typed mappings.

---

## Option 4: EligibilityCriterion Config Table with String Field Mappings

A dedicated `EligibilityCriterion` model where each row stores `shelter_field`
and `shelter_value` as strings. Matching builds OR queries dynamically. This was
the originally proposed design.

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | 2/5 | New model + M2M + management command + admin config |
| Maintainability | 3/5 | Add criterion in admin. But field mapping strings are fragile. |
| Data integrity | 2/5 | `shelter_field` strings break silently on field renames. No referential integrity. |
| Django ecosystem fit | 1/5 | Stringly-typed ORM field paths are a mini-EAV anti-pattern. |

**Rejected:** The `shelter_field`/`shelter_value` strings are fragile. A field
rename in Shelter silently breaks matching. For 7 auto-derived attributes, a
Python function is simpler and safer.

This approach *would* be appropriate if there were 30+ criteria with
non-engineers needing to add them without deploys. Can be migrated later.

---

## Option 5: JSON Field for All Criteria

Store all criteria as a JSON list with no foreign keys.

| Criteria | Rating | Notes |
|---|---|---|
| Simplicity | 5/5 | One JSON field on Referral |
| Data integrity | 2/5 | Freeform string typos break silently |

**Rejected for auto-derived attributes:** No referential integrity. Can't do
`WHERE is_veteran = true`.

**Partially adopted for manual-only tags:** The selected design uses
`manual_tags = JSONField(default=list)` for caseworker-assigned criteria.
Validated in application layer against a known set.

---

## Summary

| Option | New models? | Sync? | Type safety | Verdict |
|---|---|---|---|---|
| 1: Live direct query | 0 | No | 4/5 | Not auditable |
| 2: Dual M2M | 1 | Yes | 4/5 | Complex sync |
| **3: Frozen booleans** | **0** | **No** | **5/5** | **Selected** |
| 4: Config table w/ strings | 1 | No | 1/5 | Fragile |
| 5: JSON field (all) | 0 | No | 1/5 | No integrity |

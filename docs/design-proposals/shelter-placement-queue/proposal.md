# Proposal: Shelter Placement Queue

## Summary

**Selected architecture: Option 3 — `EligibilityCriterion` on Referral Only.**

A single new model provides a shared vocabulary of matchable client attributes. Criteria are derived from client profile fields once at referral creation and frozen on the referral. Shelters are matched via their *existing* M2Ms using a lookup dict — no data duplication, no sync. Acceptance is a two-step claim-then-place workflow. Optional email digests keep shelters informed.

### At a Glance

| Component | What changes |
|---|---|
| **`Referral`** | New `QUEUED` status (-1), new `criteria` M2M to `EligibilityCriterion` |
| **`EligibilityCriterion`** (new) | Shared vocabulary of matchable attributes with categories (demographic, situation, accessibility, household, pet) |
| **`QueueNotificationSubscription`** (new) | Per-shelter email digest settings |
| **`shelter-web`** | New Queue page + Notification Settings page |
| **`betterangels`** mobile | Future: caseworker referral creation |

### What Does NOT Change

`ClientProfile` (no new fields, no derived data), `Shelter` existing M2Ms (remain source of truth), `Reservation` workflow (unchanged), `betterangels-admin` (no changes), `Bed`/`Room` models (no changes).

### Why This Approach

- **No sync** — Shelters own their data. No signal, no backfill, no drift.
- **Auditable** — Referral captures exactly what was true at creation time.
- **Low risk** — Only new tables, no data migration. Existing functionality untouched.
- **Extensible** — Add criteria in admin + 1 line to lookup dict. Lookup dict can be promoted to a DB table later with zero code change.

Rejected alternatives: [see rejected-alternatives.md](./rejected-alternatives.md).

---

## Models

### New: `EligibilityCriterion`

A canonical vocabulary of matchable attributes. Managed via Django admin. Lives in the `referrals` app.

```python
class EligibilityCriterionCategory(models.TextChoices):
    DEMOGRAPHIC = "demographic", "Demographic"
    SITUATION = "situation", "Special Situation"
    ACCESSIBILITY = "accessibility", "Accessibility"
    HOUSEHOLD = "household", "Household"
    PET = "pet", "Pet"
    OTHER = "other", "Other"

class EligibilityCriterion(models.Model):
    category = models.CharField(choices=EligibilityCriterionCategory.choices, max_length=50)
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["category", "name"]
```

**Why categories:** Without categories, criteria are a flat list of 20+ items. Categories enable grouped display in admin and filtering by type.

**Why not a source of truth:** Criteria are derived, not primary. ClientProfile fields are the truth. Criteria are computed once at referral creation — like a search index.

#### Seeded Criteria

Initial set via management command `seed_eligibility_criteria`:

| Category | Name | Auto-derived from |
|---|---|---|
| DEMOGRAPHIC | `veteran` | `veteran_status == YES` |
| DEMOGRAPHIC | `senior` | `age >= 55` |
| DEMOGRAPHIC | `tay` | `13 <= age <= 24` |
| DEMOGRAPHIC | `single_woman` | `gender == FEMALE and age >= 18` |
| DEMOGRAPHIC | `single_man` | `gender == MALE and age >= 18` |
| DEMOGRAPHIC | `lgbtq_plus` | Manual only |
| SITUATION | `domestic_violence` | Manual only |
| SITUATION | `human_trafficking` | Manual only |
| SITUATION | `justice_system` | Manual only |
| SITUATION | `hiv_aids` | Manual only |
| ACCESSIBILITY | `wheelchair_user` | `ada_accommodation includes wheelchair` |
| ACCESSIBILITY | `medical_equipment` | `ada_accommodation includes medical_equipment` |
| HOUSEHOLD | `family` | Has `ClientHouseholdMember` records |
| HOUSEHOLD | `single_parent` | Has household + marital indicates single |
| HOUSEHOLD | `couple` | Has partner household member |
| PET | `has_dog_small` | Manual only |
| PET | `has_dog_large` | Manual only |
| PET | `has_cat` | Manual only |
| PET | `service_animal` | Manual only |

### Modified: `Referral`

```python
class Referral(BaseModel):
    class Status(models.IntegerChoices):
        QUEUED = -1, "In Queue"     # NEW
        PENDING = 0, "Pending"      # Existing
        ACCEPTED = 1, "Accepted"    # Existing
        DECLINED = 2, "Declined"    # Existing

    # ... existing fields ...

    criteria = models.ManyToManyField(            # NEW
        "EligibilityCriterion", blank=True, related_name="referrals"
    )
    declined_by = models.ManyToManyField(         # NEW
        Shelter, blank=True, related_name="declined_referrals"
    )
```

| Status | `shelter` FK | Meaning |
|---|---|---|
| `QUEUED` | `null` | Open referral. Any compatible shelter can claim. |
| `PENDING` | Set | Targeted referral. Only that shelter sees it. |
| `ACCEPTED` | Set | Claimed. Removed from queue. |
| `DECLINED` | Set | Targeted referral was declined by its shelter. Final. |

**`declined_by` M2M:** Tracks which shelters have declined an open referral. Prevents shelters from seeing clients they already passed on.

**Duplicate prevention:** A unique constraint ensures at most one `QUEUED` referral per client at a time.

### New: `QueueNotificationSubscription`

Defined in [`notifications.md`](./notifications.md).

---

## Matching Engine

### Step 1: Derive Criteria (at Referral Creation)

```python
# referrals/criteria.py

def derive_criteria(client: ClientProfile) -> set[EligibilityCriterion]:
    criteria_names = set()
    age = client.age

    if client.veteran_status == VeteranStatusEnum.YES:
        criteria_names.add("veteran")
    if age and age >= 55:
        criteria_names.add("senior")
    if age and 13 <= age <= 24:
        criteria_names.add("tay")
    if client.gender == GenderEnum.FEMALE and age and age >= 18:
        criteria_names.add("single_woman")
    if client.gender == GenderEnum.MALE and age and age >= 18:
        criteria_names.add("single_man")
    if client.ada_accommodation and "wheelchair" in client.ada_accommodation:
        criteria_names.add("wheelchair_user")
    if client.ada_accommodation and "medical_equipment" in client.ada_accommodation:
        criteria_names.add("medical_equipment")
    if client.household_members.exists():
        criteria_names.add("family")

    return set(EligibilityCriterion.objects.filter(name__in=criteria_names))
```

### Step 2: Match Shelters (at Query Time)

```python
# referrals/matching.py

CRITERION_SHELTER_MAPPING: dict[str, dict] = {
    "veteran":       {"special_situation_restrictions__name": "veterans"},
    "senior":        {"demographics__name": "seniors"},
    "tay":           {"demographics__name": "tay_teen"},
    "single_woman":  {"demographics__name": "single_women"},
    "single_man":    {"demographics__name": "single_men"},
    "lgbtq_plus":    {"demographics__name": "lgbtq_plus"},
    "family":        {"demographics__name__in": ["families", "single_moms", "single_dads"]},
    "single_parent": {"demographics__name__in": ["single_moms", "single_dads"]},
    "couple":        {"demographics__name": "couples"},
    "domestic_violence": {"special_situation_restrictions__name": "domestic_violence"},
    "human_trafficking": {"special_situation_restrictions__name": "human_trafficking"},
    "justice_system":    {"special_situation_restrictions__name": "justice_systems"},
    "hiv_aids":          {"special_situation_restrictions__name": "hiv_aids"},
    "wheelchair_user":  {"accessibility__name": "wheelchair_accessible"},
    "medical_equipment": {"accessibility__name": "medical_equipment_permitted"},
    "has_dog_small":  {"pets__name": "dogs_under_25_lbs"},
    "has_dog_large":  {"pets__name": "dogs_over_25_lbs"},
    "has_cat":        {"pets__name": "cats"},
    "service_animal": {"pets__name": "service_animals"},
}

def get_matching_shelters(referral: Referral) -> QuerySet[Shelter]:
    """Return shelters whose acceptance profile matches the referral's criteria."""
    q = Q()

    # Shelters that accept "All" demographics match everyone
    q |= Q(demographics__name="all")

    for criterion in referral.criteria.all():
        filter_kwargs = CRITERION_SHELTER_MAPPING.get(criterion.name)
        if filter_kwargs:
            q |= Q(**filter_kwargs)

    return Shelter.objects.filter(
        q,
        status=Shelter.Status.APPROVED,  # Only active/approved shelters
    ).exclude(
        id__in=referral.declined_by.values_list("id", flat=True)  # Hide already-declined
    ).distinct()
```

### Matching Example

```
Referral #42 criteria:         Shelter "Hope Haven" accepts:
  [veteran, senior,              demographics: [seniors, families]
   family,                        special_situations: [veterans]
   wheelchair_user]               accessibility: [wheelchair_accessible]

  veteran       → special_situations=veterans          ✅
  senior        → demographics=seniors                 ✅
  family        → demographics in (families, ...)      ✅
  wheelchair    → accessibility=wheelchair_accessible  ✅

  Result: 4/4 criteria match → Hope Haven shown in queue
```

### Queue Ordering

Referrals are ordered by **match count descending** (most compatible first), then by **created_at ascending** (oldest first within the same match count).

---

## Workflows

### Acceptance (Two-Step)

```
Step 1: SHELTER CLAIMS                Step 2: CLIENT ARRIVES
──────────────────────                ─────────────────────
Shelter operator clicks               Shelter staff creates
"Accept" on a queued client.          a Reservation via the
                                      existing workflow.
Referral.status → ACCEPTED
Referral.shelter → [shelter]          Reservation links to
Client removed from other             same ClientProfile.
shelters' queue views.
```

The queue is the matchmaking layer; Reservation is the operational layer. Decoupling them keeps each simple.

### Decline

- **Targeted referrals** (`PENDING`): Decline is final. Status → `DECLINED`.
- **Open referrals** (`QUEUED`): Shelter is added to `declined_by` M2M. Referral stays `QUEUED` for other shelters.

### Referral Creation Flow

```
Caseworker submits form → Validate → derive_criteria(client) → Create Referral
  status = QUEUED (if shelter=null) or PENDING (if shelter set)
  criteria.set(derived_criteria)
```

### Referral Lifecycle

```
                    ┌─────────┐
                    │ QUEUED  │  ← Open referral (shelter=null)
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        Shelter A   Shelter B   Shelter C
        [Accept]    [Decline]   (no action)
              │          │
              ▼          ▼
        ┌─────────┐  Stays QUEUED
        │ACCEPTED │  (B added to declined_by)
        └────┬────┘
             ▼
        Reservation created
             ▼
        CHECKED_IN
```

---

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | Hybrid referrals (open + targeted) | Backward compatible. Caseworkers sometimes know the right shelter. |
| 2 | `EligibilityCriterion` on Referral only | No sync. Shelters own their data. Referral captures frozen snapshot. |
| 3 | Two-step acceptance | Bed assignment happens at check-in, not at claim time. |
| 4 | Dedicated notification model | `ScheduledReport` is for org-level exports. Queue alerts are shelter-level and on-demand capable. |
| 5 | Frontend in shelter-web | Queue is a shelter operator workflow, not an admin workflow. |
| 6 | Global queue (no org silos) | Maximizes placements. Matching is attribute-driven — org is irrelevant. |

---

## Migration Impact

| Change | Type | Risk |
|---|---|---|
| `EligibilityCriterion` table | New | None — seeded by management command |
| `Referral.criteria` M2M | New through table | None |
| `Referral.declined_by` M2M | New through table | None |
| `Referral.Status.QUEUED = -1` | New integer choice | None — no conflict with 0/1/2 |
| `QueueNotificationSubscription` table | New | None |

No data migration required. Existing functionality is untouched.

---

## Open Questions

1. Should caseworkers be able to override auto-derived criteria at referral time?
2. What auto-expiry period for accepted-but-not-placed referrals?
3. Should shelters provide a reason when declining?

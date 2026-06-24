# Architecture: Shelter Placement Queue

## Overview

The queue system has three core components:

1. **`EligibilityCriterion`** — A shared vocabulary of matchable client attributes
2. **Referral with criteria** — Criteria are derived from client fields at referral creation and frozen on the Referral
3. **Shelter matching via lookup dict** — Shelters are queried using their existing M2Ms; a lookup dict maps criteria to shelter attributes

```
┌──────────────────────────┐
│  EligibilityCriterion    │  ← Shared vocabulary (admin-editable)
│  category | name (uniq)  │
└───────────┬──────────────┘
            │ M2M
            ▼
┌──────────────────────────┐      ┌─────────────────────────────┐
│  Referral                 │      │  Shelter (existing M2Ms)     │
│  criteria: [senior, ...]  │─────►│  demographics: [seniors, ...] │
│  status: QUEUED           │      │  special_sit: [veterans, ...] │
│  shelter: null            │      │  accessibility: [wheelchair]  │
└──────────────────────────┘      │  pets: [cats, ...]            │
            ▲                     └─────────────────────────────┘
            │ derive once at               ▲
            │ referral creation            │ queried via
            │                              │ CRITERION_MAPPING
┌──────────────────────────┐               │ lookup dict
│  ClientProfile            │              │
│  (source fields, readonly)│              │
│  gender, age, veteran     │              │
│  ada, household, ...      │              │
└──────────────────────────┘              │
```

**Key principle:** Criteria are on the Referral, not the ClientProfile. This avoids derived data on the source-of-truth model, eliminates sync issues, and creates an auditable frozen snapshot.

---

## Model: `EligibilityCriterion`

A canonical vocabulary of matchable attributes. Managed via Django admin. Not coupled to any specific source field.

```python
class EligibilityCriterionCategory(models.TextChoices):
    DEMOGRAPHIC = "demographic", "Demographic"
    SITUATION = "situation", "Special Situation"
    ACCESSIBILITY = "accessibility", "Accessibility"
    HOUSEHOLD = "household", "Household"
    PET = "pet", "Pet"
    OTHER = "other", "Other"

class EligibilityCriterion(models.Model):
    category = models.CharField(
        choices=EligibilityCriterionCategory.choices, max_length=50
    )
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["category", "name"]
        verbose_name = "Eligibility Criterion"
        verbose_name_plural = "Eligibility Criteria"
```

### Why Categories

Without categories, criteria are a flat list of 20+ items — hard to scan. Categories enable:
- Grouped display in admin and UI
- Filtering by type ("show me demographics only")
- Future: category-specific matching rules

### Why Not a Source of Truth

Criteria are **derived**, not primary. ClientProfile fields (gender, age, veteran_status) are the source of truth. Criteria are computed from them once at referral creation. This mirrors how search engines work — the document is the truth, the index is derived.

---

## Referral Model Changes

### New Status

```python
class Referral(BaseModel):
    class Status(models.IntegerChoices):
        QUEUED = -1, "In Queue"     # NEW
        PENDING = 0, "Pending"      # Existing
        ACCEPTED = 1, "Accepted"    # Existing
        DECLINED = 2, "Declined"    # Existing
```

| Status | `shelter` FK | Meaning |
|---|---|---|
| `QUEUED` | `null` | Open referral. Any compatible shelter can claim. |
| `PENDING` | Set | Targeted referral. Only that shelter sees it. |
| `ACCEPTED` | Set | Claimed. Removed from queue. |
| `DECLINED` | Set | One shelter declined. Client stays visible to others (if QUEUED). |

### New M2M

```python
criteria = models.ManyToManyField(
    "EligibilityCriterion", blank=True, related_name="referrals"
)
```

---

## Matching Engine

### Step 1: Derive Criteria (at Referral Creation)

A single function reads client fields and returns matching `EligibilityCriterion` instances:

```python
# referrals/criteria.py

def derive_criteria(client: ClientProfile) -> set[EligibilityCriterion]:
    """Read client fields and return matching EligibilityCriterion instances."""
    criteria_names = set()
    age = client.age  # computed property from date_of_birth

    # Demographic
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

    # Accessibility
    if client.ada_accommodation and "wheelchair" in client.ada_accommodation:
        criteria_names.add("wheelchair_user")
    if client.ada_accommodation and "medical_equipment" in client.ada_accommodation:
        criteria_names.add("medical_equipment")

    # Household
    if client.household_members.exists():
        criteria_names.add("family")

    return set(EligibilityCriterion.objects.filter(name__in=criteria_names))
```

### Step 2: Match Shelters (at Query Time)

A lookup dict maps each criterion to the shelter M2M filter it should use:

```python
# referrals/matching.py

CRITERION_SHELTER_MAPPING: dict[str, dict] = {
    # Demographic criteria → Shelter.demographics
    "veteran":       {"special_situation_restrictions__name": "veterans"},
    "senior":        {"demographics__name": "seniors"},
    "tay":           {"demographics__name": "tay_teen"},
    "single_woman":  {"demographics__name": "single_women"},
    "single_man":    {"demographics__name": "single_men"},
    "lgbtq_plus":    {"demographics__name": "lgbtq_plus"},
    "family":        {"demographics__name__in": ["families", "single_moms", "single_dads"]},
    "single_parent": {"demographics__name__in": ["single_moms", "single_dads"]},
    "couple":        {"demographics__name": "couples"},

    # Situation criteria → Shelter.special_situation_restrictions
    "domestic_violence": {"special_situation_restrictions__name": "domestic_violence"},
    "human_trafficking": {"special_situation_restrictions__name": "human_trafficking"},
    "justice_system":    {"special_situation_restrictions__name": "justice_systems"},
    "hiv_aids":          {"special_situation_restrictions__name": "hiv_aids"},

    # Accessibility criteria → Shelter.accessibility
    "wheelchair_user":  {"accessibility__name": "wheelchair_accessible"},
    "medical_equipment": {"accessibility__name": "medical_equipment_permitted"},

    # Pet criteria → Shelter.pets
    "has_dog_small":  {"pets__name": "dogs_under_25_lbs"},
    "has_dog_large":  {"pets__name": "dogs_over_25_lbs"},
    "has_cat":        {"pets__name": "cats"},
    "service_animal": {"pets__name": "service_animals"},
}

def get_matching_shelters(referral: Referral) -> QuerySet[Shelter]:
    """Return shelters whose existing M2Ms match the referral's criteria."""
    q = Q()
    for criterion in referral.criteria.all():
        filter_kwargs = CRITERION_SHELTER_MAPPING.get(criterion.name)
        if filter_kwargs:
            q |= Q(**filter_kwargs)
    return Shelter.objects.filter(q).distinct() if q else Shelter.objects.none()
```

### Why a Lookup Dict

- **Data, not logic.** Easy to read, audit, and test.
- **Single responsibility.** One place to see all criterion→shelter mappings.
- **Future-proof.** Can be promoted to a database table (`CriterionShelterMapping`) if we need admin-editable mappings.
- **No shelter sync.** Shelters continue managing their own M2Ms. No duplication, no drift.

### Matching Example

```
Referral #42 criteria:         Shelter "Hope Haven" accepts:
  [veteran, senior,              demographics: [seniors, families]
   family,                        special_situations: [veterans]
   wheelchair_user]               accessibility: [wheelchair_accessible]
                                  pets: [service_animals]

  veteran       → special_situations=veterans          ✅
  senior        → demographics=seniors                 ✅
  family        → demographics in (families, ...)      ✅
  wheelchair    → accessibility=wheelchair_accessible  ✅

  Result: 4/4 criteria match → Hope Haven shown in queue
```

---

## Acceptance Workflow

### Two-Step Process

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

### Rationale

- Shelters may not know which bed is available when claiming a client.
- Bed assignment happens at check-in — hours or days after acceptance.
- The queue is the **matchmaking layer**; the existing Reservation system is the **operational layer**. They are deliberately decoupled.

### Future Enhancement

Auto-expire accepted referrals where no Reservation is created within X days. Client returns to the queue.

---

## Data Flow Diagrams

### Referral Creation

```
Caseworker submits referral form
         │
         ▼
┌─────────────────────────┐
│ 1. Validate input       │
│    - client exists      │
│    - shelter (optional) │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 2. Derive criteria      │
│    derive_criteria(     │
│      client_profile)    │
│    → set of Criterion   │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 3. Create Referral      │
│    - status = QUEUED    │
│      (or PENDING if     │
│       shelter specified)│
│    - shelter = null     │
│      (or specific)      │
│    - criteria.set(...)  │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 4. Return Referral      │
│    (GraphQL response)   │
└─────────────────────────┘
```

### Shelter Queue View

```
Shelter operator opens Queue page
         │
         ▼
┌──────────────────────────────────────────┐
│ GraphQL: queueReferrals(shelterId)       │
│                                          │
│ Backend:                                 │
│ 1. Fetch shelter by ID                   │
│ 2. Get all QUEUED referrals              │
│    (with shelter=null)                   │
│ 3. For each, check if criteria match     │
│    shelter's M2Ms via CRITERION_MAPPING  │
│ 4. Return matching referrals             │
└──────────────┬───────────────────────────┘
               ▼
┌──────────────────────────────────────────┐
│ Frontend: sortable/filterable table      │
│ Name | Criteria Match | Referred Date    │
│ [Accept] [Decline]                       │
└──────────────────────────────────────────┘
```

---

## Seeded Criteria

Initial set populated via management command `seed_eligibility_criteria`:

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

### Manual vs. Auto-Derived

Criteria marked "Manual only" represent data not currently captured in `ClientProfile` fields. These can be:
- Selected by caseworker at referral time (future enhancement)
- Derived from future client profile fields
- Added as an overridable default (caseworker can adjust auto-derived criteria before submitting)

---

## Migration Impact

| Change | Impact |
|---|---|
| `EligibilityCriterion` table | New — seeded by management command |
| `Referral.criteria` M2M | New through table — initially empty |
| `Referral.Status.QUEUED = -1` | New integer value — no conflict with 0/1/2 |
| `QueueNotificationSubscription` table | New — initially empty |
| Existing `PENDING`/`ACCEPTED` referrals | Unaffected — no backfill needed |

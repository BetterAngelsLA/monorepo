# Models: Shelter Placement Queue

## Overview

Two new models and one model change. No existing models are modified beyond adding fields.

```
┌──────────────────────────┐
│  EligibilityCriterion    │  ← NEW: shared vocabulary (admin-editable)
│  category | name (uniq)  │
└───────────┬──────────────┘
            │ M2M
            ▼
┌──────────────────────────┐
│  Referral                 │  ← MODIFIED: new status + new M2M
│  criteria: [senior, ...]  │
│  status: QUEUED           │
└──────────────────────────┘
```

---

## New: `EligibilityCriterion`

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

### Seeded Criteria

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

Criteria marked "Manual only" represent data not currently captured in `ClientProfile` fields. These can be selected by caseworker at referral time (future enhancement) or derived from future client profile fields.

---

## Modified: `Referral`

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

## New: `QueueNotificationSubscription`

Defined in [`notifications.md`](./notifications.md).

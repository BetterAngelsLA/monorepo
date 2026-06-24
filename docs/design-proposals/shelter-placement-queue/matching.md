# Matching Engine: Shelter Placement Queue

## Overview

Matching has two steps, both simple:

1. **At referral creation:** Derive criteria from the client's profile fields
2. **At query time:** Map those criteria to shelter M2M filters and query

---

## Step 1: Derive Criteria

Runs once when a referral is created. Reads client profile fields and returns matching `EligibilityCriterion` instances.

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

The derived criteria are frozen on the referral as an M2M. They do not change if the client profile is later updated.

---

## Step 2: Match Shelters

A lookup dict maps each criterion name to the shelter M2M filter it should use.

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

---

## Why a Lookup Dict

- **Data, not logic.** Easy to read, audit, and test.
- **Single responsibility.** One place to see all criterion→shelter mappings.
- **Future-proof.** Can be promoted to a database table (`CriterionShelterMapping`) if we want admin-editable mappings — zero code change to the matching engine.
- **No shelter sync.** Shelters continue managing their own M2Ms. No duplication, no drift.

---

## Matching Example

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

## Performance Note

The matching query iterates over queued referrals and applies OR filters per criterion. If the queue grows large (>1000 referrals), we can add a reverse index — precompute which criteria each shelter matches against and query referrals by criteria membership. This optimization can be added later without API changes.

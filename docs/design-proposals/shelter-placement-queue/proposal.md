# Proposal: Shelter Placement Queue

## Summary

**Selected architecture: Option 3 — `EligibilityCriterion` on Referral Only.**

A single new model provides a shared vocabulary of matchable client attributes. Criteria are derived from client profile fields once at referral creation and frozen on the referral. Shelters are matched via their *existing* M2Ms — each criterion carries its own shelter field mapping, so no external lookup dict or sync is needed. Acceptance is a two-step claim-then-place workflow with prioritization tiers. Optional email digests keep shelters informed.

### At a Glance

| Component | What changes |
|---|---|
| **`Referral`** | New `QUEUED` status (-1), new `criteria` M2M, new `population` and `priority` fields |
| **`EligibilityCriterion`** (new) | Shared vocabulary of matchable attributes with categories and shelter field mappings |
| **`QueueNotificationSubscription`** (new) | Per-shelter email digest settings |
| **`shelter-web`** | New Queue page + Notification Settings page |
| **`betterangels`** mobile | Future: caseworker referral creation |

### What Does NOT Change

`ClientProfile` (no new fields, no derived data), `Shelter` existing M2Ms (remain source of truth), `Reservation` workflow (unchanged), `betterangels-admin` (no changes), `Bed`/`Room` models (no changes).

### Why This Approach

- **No sync** — Shelters own their data. No signal, no backfill, no drift.
- **Auditable** — Referral captures exactly what was true at creation time.
- **Low risk** — Only new tables, no data migration. Existing functionality untouched.
- **Extensible** — Add criteria in admin. Each criterion knows its shelter mapping. No code deploy needed.
- **Self-documenting** — Browse the admin to see all criteria and their shelter fields.

### National Standards Alignment

This design aligns with HUD's Coordinated Entry framework (CPD-17-01), used by LA, SF, NYC, and all federally-funded CoCs. See [research.md](./research.md) for the full analysis.

Key alignments:
- **Population segmentation** — Adult, Family, and TAY tracks (standard across all CoCs)
- **Prioritization** — Simple tiers mirror HUD's vulnerability-based prioritization mandate
- **Standardized criteria** — Derived from client profile fields (foundation for future assessment tool integration)

Rejected alternatives: [see rejected-alternatives.md](./rejected-alternatives.md).

---

## Models

### New: `EligibilityCriterion`

A canonical vocabulary of matchable attributes. Managed via Django admin. Lives in the `referrals` app. Each row knows how to query shelters — no external mapping dict needed.

```python
class EligibilityCriterionCategory(models.TextChoices):
    DEMOGRAPHIC = "demographic", "Demographic"
    SITUATION = "situation", "Special Situation"
    ACCESSIBILITY = "accessibility", "Accessibility"
    HOUSEHOLD = "household", "Household"
    PET = "pet", "Pet"
    REQUIREMENT = "requirement", "Entry Requirement"
    MEDICAL = "medical", "Medical Need"
    OTHER = "other", "Other"

class EligibilityCriterion(models.Model):
    category = models.CharField(choices=EligibilityCriterionCategory.choices, max_length=50)
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)

    # How to match this criterion against shelters (null = manual-only criterion)
    shelter_field = models.CharField(max_length=100, null=True, blank=True)
    shelter_value = models.CharField(max_length=100, null=True, blank=True)
    shelter_values = models.JSONField(null=True, blank=True)  # For multi-value matches

    class Meta:
        ordering = ["category", "name"]
```

**Why categories:** Without categories, criteria are a flat list of 25+ items. Categories enable grouped display in admin and filtering by type.

**Why not a source of truth:** Criteria are derived, not primary. ClientProfile fields are the truth. Criteria are computed once at referral creation.

**Why criterion-level mappings:** Each criterion carries `shelter_field`, `shelter_value`, and optional `shelter_values` (for multi-value matches like "families OR single_moms OR single_dads"). Adding a new criterion = 1 admin row. The mapping is self-documenting.

### Seeded Criteria

Initial set via management command `seed_eligibility_criteria`:

| Category | Name | Auto-derived from | Shelter field | Shelter value(s) |
|---|---|---|---|---|
| DEMOGRAPHIC | `veteran` | `veteran_status == YES` | `special_situation_restrictions__name` | `veterans` |
| DEMOGRAPHIC | `senior` | `age >= 55` | `demographics__name` | `seniors` |
| DEMOGRAPHIC | `tay` | `13 <= age <= 24` | `demographics__name` | `tay_teen` |
| DEMOGRAPHIC | `single_woman` | `gender == FEMALE and age >= 18` | `demographics__name` | `single_women` |
| DEMOGRAPHIC | `single_man` | `gender == MALE and age >= 18` | `demographics__name` | `single_men` |
| DEMOGRAPHIC | `lgbtq_plus` | Manual only | `demographics__name` | `lgbtq_plus` |
| SITUATION | `domestic_violence` | Manual only | `special_situation_restrictions__name` | `domestic_violence` |
| SITUATION | `human_trafficking` | Manual only | `special_situation_restrictions__name` | `human_trafficking` |
| SITUATION | `justice_system` | Manual only | `special_situation_restrictions__name` | `justice_systems` |
| SITUATION | `hiv_aids` | Manual only | `special_situation_restrictions__name` | `hiv_aids` |
| ACCESSIBILITY | `wheelchair_user` | `ada_accommodation includes wheelchair` | `accessibility__name` | `wheelchair_accessible` |
| ACCESSIBILITY | `medical_equipment` | `ada_accommodation includes medical_equipment` | `accessibility__name` | `medical_equipment_permitted` |
| HOUSEHOLD | `family` | Has `ClientHouseholdMember` records | `demographics__name` | `["families","single_moms","single_dads"]` |
| HOUSEHOLD | `single_parent` | Has household + marital indicates single | `demographics__name` | `["single_moms","single_dads"]` |
| HOUSEHOLD | `couple` | Has partner household member | `demographics__name` | `couples` |
| PET | `has_dog_small` | Manual only | `pets__name` | `dogs_under_25_lbs` |
| PET | `has_dog_large` | Manual only | `pets__name` | `dogs_over_25_lbs` |
| PET | `has_cat` | Manual only | `pets__name` | `cats` |
| PET | `service_animal` | Manual only | `pets__name` | `service_animals` |
| REQUIREMENT | `photo_id` | Manual only | `entry_requirements__name` | `photo_id` |
| REQUIREMENT | `background_check` | Manual only | `entry_requirements__name` | `background` |
| REQUIREMENT | `walk_ups` | Manual only | `entry_requirements__name` | `walk_ups` |
| REQUIREMENT | `in_spa_only` | Manual only | `entry_requirements__name` | `in_spa_only` |
| MEDICAL | `dmh` | Manual only | `medical_needs__name` | `dmh` |
| MEDICAL | `oxygen` | Manual only | `medical_needs__name` | `oxygen` |

Criteria marked "Manual only" represent data not currently captured in `ClientProfile` fields. These can be selected by caseworker at referral time (future enhancement).

### Modified: `Referral`

```python
class Referral(BaseModel):
    class Status(models.IntegerChoices):
        QUEUED = -1, "In Queue"     # NEW
        PENDING = 0, "Pending"      # Existing
        ACCEPTED = 1, "Accepted"    # Existing
        DECLINED = 2, "Declined"    # Existing

    class Population(models.TextChoices):  # NEW
        ADULT = "adult", "Adult (18+)"
        FAMILY = "family", "Family (with minors)"
        TAY = "tay", "TAY/Youth (18-24)"

    class Priority(models.IntegerChoices):  # NEW
        STANDARD = 0, "Standard"
        ELEVATED = 1, "Elevated"
        URGENT = 2, "Urgent"

    # ... existing fields ...
    population = models.CharField(choices=Population.choices, max_length=20, default=Population.ADULT)
    priority = models.IntegerField(choices=Priority.choices, default=Priority.STANDARD)
    criteria = models.ManyToManyField("EligibilityCriterion", blank=True, related_name="referrals")
    declined_by = models.ManyToManyField(Shelter, blank=True, related_name="declined_referrals")
```

| Status | `shelter` FK | Meaning |
|---|---|---|
| `QUEUED` | `null` | Open referral. Any compatible shelter can claim. |
| `PENDING` | Set | Targeted referral. Only that shelter sees it. |
| `ACCEPTED` | Set | Claimed. Removed from queue. |
| `DECLINED` | Set | Targeted referral was declined by its shelter. Final. |

**`population`** — Explicit population segment (Adult, Family, TAY). Aligns with HUD Coordinated Entry standards used by LA, SF, and NYC. Shelters can filter the queue by population before checking detailed criteria.

**`priority`** — Caseworker-assigned prioritization tier:

| Tier | Criteria |
|---|---|
| Urgent (2) | DV situation, medical crisis, extreme weather, 65+ unsheltered |
| Elevated (1) | Chronic homelessness, veteran, disabling condition, 55+ |
| Standard (0) | All others |

**`declined_by` M2M:** Tracks which shelters have declined an open referral. Prevents shelters from seeing clients they already passed on.

**Duplicate prevention:** A unique constraint ensures at most one `QUEUED` referral per client at a time.

### New: `QueueNotificationSubscription`

Defined in [notifications.md](./notifications.md).

---

## Matching Engine

### Step 1: Derive Criteria (at Referral Creation)

A simple function reads client profile fields and returns matching `EligibilityCriterion` instances. It handles 7 auto-derivable criteria in ~20 lines:

```python
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

The remaining criteria are manual-only — selected by the caseworker at referral time.

Derived criteria are frozen on the referral as an M2M. They do not change if the client profile is later updated.

### Step 2: Match Shelters (at Query Time)

Each `EligibilityCriterion` carries its own shelter mapping. No external lookup dict needed:

```python
def get_matching_shelters(referral: Referral) -> QuerySet[Shelter]:
    """Return shelters whose acceptance profile matches the referral's criteria."""
    q = Q()

    # Shelters accepting "All" demographics match every client
    q |= Q(demographics__name="all")

    # Each criterion knows which shelter M2M field and value to query
    for criterion in referral.criteria.filter(shelter_field__isnull=False):
        if criterion.shelter_values:
            q |= Q(**{f"{criterion.shelter_field}__in": criterion.shelter_values})
        else:
            q |= Q(**{criterion.shelter_field: criterion.shelter_value})

    return Shelter.objects.filter(
        q,
        status=Shelter.Status.APPROVED,
    ).exclude(
        id__in=referral.declined_by.values_list("id", flat=True),
    ).distinct()
```

Adding a new criterion = 1 admin row. No code change. No mapping dict to update. The admin becomes the configuration interface for matching rules.

### Matching Example

```
Referral #42 criteria:         Shelter "Hope Haven" accepts:
  [veteran, senior,              demographics: [seniors, families]
   family,                        special_situations: [veterans]
   wheelchair_user]               accessibility: [wheelchair_accessible]

  veteran       → special_situations=veterans          ✅
  senior        → demographics=seniors                 ✅
  family        → demographics in [families,...]       ✅
  wheelchair    → accessibility=wheelchair_accessible  ✅

  Result: 4/4 criteria match → Hope Haven shown in queue
```

### Queue Ordering

1. **Priority descending** (Urgent → Elevated → Standard) — aligns with HUD prioritization
2. Then **match count descending** (most compatible first)
3. Then **created_at ascending** (oldest first)

### Performance Note

The matching query builds one OR filter per criterion. If the queue grows large (>1000 referrals), add a reverse index — precompute which criteria each shelter matches and query referrals by criteria membership. This optimization can be added without API changes.

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

The queue is the matchmaking layer; Reservation is the operational layer. Decoupled by design.

### Decline

- **Targeted referrals** (`PENDING`): Decline is final. Status → `DECLINED`.
- **Open referrals** (`QUEUED`): Shelter added to `declined_by` M2M. Referral stays `QUEUED` for other shelters.

### Referral Creation Flow

```
Caseworker submits form → Validate → derive_criteria(client) → Create Referral
  population = adult|family|tay
  priority = standard|elevated|urgent
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
| 2 | `EligibilityCriterion` on Referral only | No sync. Each criterion carries its own shelter mapping. |
| 3 | Two-step acceptance | Bed assignment happens at check-in, not at claim time. |
| 4 | Dedicated notification model | `ScheduledReport` is for org-level exports. Queue alerts are shelter-level. |
| 5 | Frontend in shelter-web | Queue is a shelter operator workflow, not an admin workflow. |
| 6 | Global queue (no org silos) | Maximizes placements. Matching is attribute-driven. |
| 7 | Population segmentation | Adult/Family/TAY tracks align with HUD CE standards (LA, SF, NYC). |
| 8 | Priority tiers | Simple caseworker-assigned prioritization mirrors HUD's vulnerability mandate. |
| 9 | Criterion-level shelter mappings | Each criterion knows its shelter field. No external mapping dict. |

---

## Migration Impact

| Change | Type | Risk |
|---|---|---|
| `EligibilityCriterion` table | New | None — seeded by management command |
| `Referral.criteria` M2M | New through table | None |
| `Referral.declined_by` M2M | New through table | None |
| `Referral.population` field | New column | None |
| `Referral.priority` field | New column | None |
| `Referral.Status.QUEUED = -1` | New integer choice | None — no conflict with 0/1/2 |
| `QueueNotificationSubscription` table | New | None |

No data migration required. Existing functionality is untouched.

---

## Open Questions

1. Should caseworkers be able to override/adjust auto-derived criteria at referral time?
2. What auto-expiry period for accepted-but-not-placed referrals?
3. Should shelters provide a reason when declining?
4. Should priority be auto-derived from client fields (chronic homelessness, age, DV) rather than caseworker-assigned?

# Proposal: Shelter Placement Queue (Revised)

## Summary

**Frozen attributes on Referral, direct matching against existing Shelter M2Ms.**

Client attributes relevant to shelter matching are derived once from `ClientProfile`
at referral creation and frozen as concrete boolean fields on the `Referral` model.
Shelters are matched by a straightforward Python function that queries their
*existing* M2Ms — no config tables, no stringly-typed field mappings, no sync.
Acceptance is a two-step claim-then-place workflow with HUD-aligned prioritization
tiers. A proper through-model tracks declines with timestamps.

### Design Principles

Based on [research into Django ecosystem patterns](./research.md#djangosql-patterns-for-attribute-based-matching):

1. **Concrete columns for stable attributes.** For ≤15 attributes that change rarely,
   `BooleanField` columns are simpler, type-safe, and database-queryable.
2. **Matching logic in Python, not database rows.** Database-driven matching rules
   (config tables with field-path strings) are a mini-EAV anti-pattern at this scale.
3. **Through-model M2Ms for any relationship needing metadata.** Raw `ManyToManyField`
   loses timestamps and actor tracking — the first "who declined when?" question
   pays for the 5 extra lines of code.
4. **Defer features until they're requested.** Notifications can start as a
   management command; graduate to a dedicated model when shelters ask for
   per-frequency preferences.

### At a Glance

| Component | What changes |
|---|---|
| **`Referral`** | New `QUEUED` status (-1), 8 frozen boolean fields, `manual_tags` JSONField, `population`, `priority` |
| **`ReferralDecline`** (new) | Through model tracking which shelter declined, when, and optionally why |
| **`shelter-web`** | New Queue page |
| **`betterangels`** mobile | Future: caseworker referral creation |

### What Does NOT Change

`ClientProfile` (no new fields), `Shelter` existing M2Ms (remain source of truth),
`Reservation` workflow (unchanged), `betterangels-admin` (no changes),
`Bed`/`Room` models (no changes).

### Why This Approach

- **No sync** — Shelters own their data. No signal, no backfill, no drift.
- **Auditable** — Referral captures exactly what was true at creation time.
- **Low risk** — New columns on an existing table + one small new table. No data migration.
- **Type-safe** — Boolean fields have database-level integrity. No string typos.
- **Simple to understand** — One Python file with `derive` + `match` functions, side by side.
- **Follows Django conventions** — Through-model for decline tracking, concrete columns for
  stable attributes. Patterns familiar to any Django developer.

### National Standards Alignment

Same as before — aligns with HUD's Coordinated Entry framework (CPD-17-01).
See [research.md](./research.md) for the full analysis.

### Metro Operational Model Compatibility

Same as before — supports centralized placement (NYC), coordinated matching (SF),
and shelter-choice (LA) models.

---

## Models

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

    # ── Existing fields (unchanged) ──
    client_profile = models.ForeignKey("clients.ClientProfile", ...)
    shelter = models.ForeignKey("shelters.Shelter", ..., null=True, blank=True)
    created_by = models.ForeignKey(User, ...)
    organization = models.ForeignKey(Organization, ...)
    status = IntegerChoicesField(Status, default=Status.PENDING, db_index=True)
    notes = models.TextField(blank=True, null=True)

    # ── New: segmentation + prioritization ──
    population = models.CharField(
        choices=Population.choices, max_length=20, default=Population.ADULT
    )
    priority = models.IntegerField(
        choices=Priority.choices, default=Priority.STANDARD
    )

    # ── New: frozen matchable attributes (derived once from ClientProfile) ──
    is_veteran = models.BooleanField(default=False)
    is_senior = models.BooleanField(default=False)           # age >= 55
    is_tay = models.BooleanField(default=False)              # 13 <= age <= 24
    is_family = models.BooleanField(default=False)           # has household members
    is_single_woman = models.BooleanField(default=False)     # gender=F, age>=18
    is_single_man = models.BooleanField(default=False)       # gender=M, age>=18
    is_wheelchair_user = models.BooleanField(default=False)
    has_medical_equipment = models.BooleanField(default=False)

    # ── New: manual-only criteria not captured in ClientProfile fields ──
    # e.g. ["domestic_violence", "has_dog_small", "photo_id"]
    manual_tags = models.JSONField(default=list, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["client_profile"],
                condition=models.Q(status=Referral.Status.QUEUED),
                name="one_queued_referral_per_client",
            )
        ]
        ordering = ["-created_at"]
```

| Status | `shelter` FK | Meaning |
|---|---|---|
| `QUEUED` | `null` | Open referral. Any compatible shelter can claim. |
| `PENDING` | Set | Targeted referral. Only that shelter sees it. |
| `ACCEPTED` | Set | Claimed. Removed from queue. |
| `DECLINED` | Set | Targeted referral was declined by its shelter. Final. |

**`population`** — Explicit HUD population track (Adult, Family, TAY). Shelters
can pre-filter the queue by population before checking detailed criteria.

**`priority`** — Caseworker-assigned tier:

| Tier | Criteria |
|---|---|
| Urgent (2) | DV situation, medical crisis, extreme weather, 65+ unsheltered |
| Elevated (1) | Chronic homelessness, veteran, disabling condition, 55+ |
| Standard (0) | All others |

**`manual_tags`** — JSON list of strings for criteria without corresponding
`ClientProfile` fields (e.g., `"domestic_violence"`, `"has_dog_small"`,
`"photo_id"`). Selected by caseworker at referral time. These are matched
against shelter M2Ms using the same pattern as boolean fields — a Python
function maps each tag name to the appropriate shelter M2M lookup. Unlike the
previous proposal's `EligibilityCriterion` model, there is no separate database
table for these tags; they are plain strings validated against a known set in
the application layer.

**Duplicate prevention:** The `UniqueConstraint` ensures at most one `QUEUED`
referral per client at a time.

### New: `ReferralDecline`

A through model capturing metadata about each decline, following the standard
Django pattern for M2M relationships that need extra fields.

```python
class ReferralDecline(BaseModel):
    referral = models.ForeignKey(
        Referral, on_delete=models.CASCADE, related_name="declines"
    )
    shelter = models.ForeignKey(
        Shelter, on_delete=models.CASCADE, related_name="declined_referrals"
    )
    declined_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="referral_declines"
    )
    reason = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["referral", "shelter"],
                name="one_decline_per_shelter_per_referral",
            )
        ]
```

**Why a through model:** A raw `declined_by = ManyToManyField(Shelter)` loses
the timestamp (via `BaseModel.created_at`), the identity of who declined, and
any reason. These are valuable for audit trails and operational debugging. The
cost is ~10 lines of code.

---

## Matching Engine

### Step 1: Derive Attributes (at Referral Creation)

A simple function reads `ClientProfile` fields and returns a dict of boolean
values + manual tags. Lives in `referrals/selectors.py`.

```python
def derive_referral_attrs(client: ClientProfile) -> dict:
    """Derive frozen matchable attributes from client profile fields.

    Called once at referral creation. Returns kwargs for Referral() constructor.
    """
    age = client.age
    ada = client.ada_accommodation or ""

    return {
        "is_veteran": client.veteran_status == VeteranStatusEnum.YES,
        "is_senior": bool(age and age >= 55),
        "is_tay": bool(age and 13 <= age <= 24),
        "is_family": client.household_members.exists(),
        "is_single_woman": (
            client.gender == GenderEnum.FEMALE and bool(age and age >= 18)
        ),
        "is_single_man": (
            client.gender == GenderEnum.MALE and bool(age and age >= 18)
        ),
        "is_wheelchair_user": "wheelchair" in ada,
        "has_medical_equipment": "medical_equipment" in ada,
    }
    # manual_tags are set separately by the caseworker at referral time
```

Derived attributes are frozen as boolean columns on the referral. They do not
change if the client profile is later updated.

### Step 2: Match Shelters (at Query Time)

A straightforward function that queries Shelter M2Ms based on the referral's
frozen attributes. Lives in `referrals/selectors.py`, alongside the derivation
function.

```python
def get_matching_shelters(referral: Referral) -> QuerySet[Shelter]:
    """Return shelters whose acceptance profile matches the referral's attributes."""

    # Shelters accepting "All" demographics match every client
    q = Q(demographics__name="all")

    if referral.is_veteran:
        q |= Q(special_situation_restrictions__name="veterans")
    if referral.is_senior:
        q |= Q(demographics__name="seniors")
    if referral.is_tay:
        q |= Q(demographics__name="tay_teen")
    if referral.is_single_woman:
        q |= Q(demographics__name="single_women")
    if referral.is_single_man:
        q |= Q(demographics__name="single_men")
    if referral.is_family:
        q |= Q(demographics__name__in=["families", "single_moms", "single_dads"])
    if referral.is_wheelchair_user:
        q |= Q(accessibility__name="wheelchair_accessible")
    if referral.has_medical_equipment:
        q |= Q(accessibility__name="medical_equipment_permitted")

    # Manual tags: each tag maps to a shelter M2M lookup
    for tag in referral.manual_tags:
        q |= _tag_to_shelter_q(tag)

    declined_shelter_ids = referral.declines.values_list("shelter_id", flat=True)

    return Shelter.objects.filter(
        q,
        status=Shelter.Status.APPROVED,
    ).exclude(
        id__in=declined_shelter_ids,
    ).distinct()


def _tag_to_shelter_q(tag: str) -> Q:
    """Map a manual tag name to a shelter M2M query condition."""
    mapping = {
        "domestic_violence": Q(special_situation_restrictions__name="domestic_violence"),
        "human_trafficking": Q(special_situation_restrictions__name="human_trafficking"),
        "justice_system": Q(special_situation_restrictions__name="justice_systems"),
        "hiv_aids": Q(special_situation_restrictions__name="hiv_aids"),
        "lgbtq_plus": Q(demographics__name="lgbtq_plus"),
        "has_dog_small": Q(pets__name="dogs_under_25_lbs"),
        "has_dog_large": Q(pets__name="dogs_over_25_lbs"),
        "has_cat": Q(pets__name="cats"),
        "service_animal": Q(pets__name="service_animals"),
        "photo_id": Q(entry_requirements__name="photo_id"),
        "background_check": Q(entry_requirements__name="background"),
        "walk_ups": Q(entry_requirements__name="walk_ups"),
        "in_spa_only": Q(entry_requirements__name="in_spa_only"),
        "dmh": Q(medical_needs__name="dmh"),
        "oxygen": Q(medical_needs__name="oxygen"),
    }
    return mapping.get(tag, Q())
```

### Why This Approach vs. the Original `EligibilityCriterion` Model

| Concern | Frozen booleans + Python function |
|---|---|
| **Adding a new auto-derived criterion** | 1 migration (new BooleanField) + 1 line in `derive_referral_attrs` + 2 lines in `get_matching_shelters`. ~5 lines total. |
| **Adding a new manual tag** | 1 line in `_tag_to_shelter_q` mapping dict. ~1 line. |
| **Field renames caught?** | Yes — ORM attribute access fails loudly at import time, not silently at query time. |
| **Referential integrity** | Boolean columns are type-checked by the database. Tag names are validated against the mapping dict. |
| **Can non-engineers add criteria?** | No — requires a code deploy. For the current scale (7 auto + ~15 manual), this is acceptable. If the system reaches 30+ criteria with frequent non-engineer additions, graduate to a Tag model (django-taggit pattern). |

### Matching Example

```
Referral #42 attributes:          Shelter "Hope Haven" accepts:
  is_veteran = True                 demographics: [seniors, families]
  is_senior = True                  special_situations: [veterans]
  is_family = True                  accessibility: [wheelchair_accessible]
  is_wheelchair_user = True

  is_veteran          → special_situations=veterans          ✅
  is_senior           → demographics=seniors                 ✅
  is_family           → demographics in [families,...]       ✅
  is_wheelchair_user  → accessibility=wheelchair_accessible  ✅

  Result: 4/4 attributes match → Hope Haven shown in queue
```

### Queue Ordering

1. **Priority descending** (Urgent → Elevated → Standard)
2. Then **match count descending** (most compatible first)
3. Then **created_at ascending** (oldest first)

### Match Count

Computed at query time or annotated on the queryset by counting how many of
the referral's attributes overlap with the shelter's M2Ms.

### Performance Note

The matching query builds one OR filter per attribute. For the expected queue
size (dozens to low hundreds), this is well within PostgreSQL's capabilities.
If the queue grows large (>1000 referrals), caching shelter M2M memberships
or adding a materialized view can be added without API changes.

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

The queue is the matchmaking layer; Reservation is the operational layer.
Decoupled by design.

### Decline

- **Targeted referrals** (`PENDING`): Decline is final. Status → `DECLINED`.
- **Open referrals** (`QUEUED`): A `ReferralDecline` record is created with
  timestamp and optional reason. Referral stays `QUEUED` for other shelters.

### Referral Creation Flow

```
Caseworker submits form → Validate →
  derive_referral_attrs(client) → Create Referral with:
    population = adult|family|tay
    priority = standard|elevated|urgent
    is_veteran, is_senior, is_tay, ... (from derive function)
    manual_tags = ["domestic_violence", "has_dog_small"] (caseworker-selected)
    status = QUEUED (if shelter=null) or PENDING (if shelter set)
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
        │ACCEPTED │  (B → ReferralDecline created)
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
| 2 | Frozen boolean fields on Referral | Type-safe, database-queryable, no config table overhead. Django ecosystem standard for ≤15 stable attributes. |
| 3 | Two-step acceptance | Bed assignment happens at check-in, not at claim time. Decouples matching from operations. |
| 4 | Through-model for declines | Timestamps, actor, and reason are standard for audit trails. A raw M2M loses this. |
| 5 | Frontend in shelter-web | Queue is a shelter operator workflow, not an admin workflow. |
| 6 | Global queue (no org silos) | Maximizes placements. Matching is attribute-driven. |
| 7 | Population segmentation | Adult/Family/TAY tracks align with HUD CE standards (LA, SF, NYC). |
| 8 | Priority tiers | Simple caseworker-assigned prioritization mirrors HUD's vulnerability mandate. |
| 9 | Matching logic in Python, not DB rows | For 7 auto-derived + ~15 manual attributes, a Python function is more readable, testable, and maintainable than a config table with string field paths. |

---

## Migration Impact

| Change | Type | Risk |
|---|---|---|
| `Referral.is_veteran` through `Referral.has_medical_equipment` (8 fields) | New boolean columns | None — all default to `False` |
| `Referral.manual_tags` | New JSONField column | None — defaults to `[]` |
| `Referral.population` field | New column | None |
| `Referral.priority` field | New column | None |
| `Referral.Status.QUEUED = -1` | New integer choice | None — no conflict with 0/1/2 |
| `ReferralDecline` table | New table | None |

No data migration required. No management commands to run. Existing
functionality is untouched.

---

## What's Deferred

| Feature | Rationale |
|---|---|
| **Email notifications** | The codebase already has `django-post_office` + Celery. When shelters request queue notifications, start with a management command that queries matching referrals and sends via the existing `send_queued_mail` infrastructure. Graduate to a `QueueNotificationSubscription` model only when per-shelter per-frequency preferences are needed. |
| **Admin-managed criteria vocabulary** | For the current scale (7 auto-derived + ~15 manual), the `_tag_to_shelter_q` mapping dict is sufficient. If the system reaches 30+ criteria with frequent additions by non-engineers, graduate to a `Tag`-style model (following the django-taggit pattern: `name` + `category` only, no field mappings). |
| **Bed availability filtering** | Already possible via `ShelterAvailability` and `Bed.computed_status`. Add a filter to the matching query when shelters begin reliably updating availability. No model changes needed. |
| **Full VI-SPDAT / Next Step assessment integration** | Requires formal assessment tool licensing and training. |

---

## Open Questions

1. Should caseworkers be able to override auto-derived boolean fields at referral
   time? (e.g., uncheck `is_senior` for a 56-year-old who doesn't identify as senior)
2. What auto-expiry period for accepted-but-not-placed referrals?
3. Should `ReferralDecline.reason` be a free-text field or a choice enum?
4. Should priority be auto-derived from client fields (chronic homelessness, age,
   DV history) rather than caseworker-assigned?

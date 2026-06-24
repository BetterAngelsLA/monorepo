# Design Proposal: Shelter Placement Queue

- **Status:** Proposal — Open for Review
- **Author:** AI-assisted design session
- **Date:** 2026-06-24
- **Target:** `shelter-web` (operator portal) + `betterangels-backend`

---

## Problem Statement

Currently, caseworkers must know which shelter to send a client to and whether that shelter has availability. There is no mechanism for:

1. Caseworkers to submit a client into a general pool for shelter matching
2. Shelters to discover and claim compatible clients from a queue
3. Shelters to receive notifications about clients matching their acceptance criteria

This proposal introduces a **shelter placement queue** — a global pool of referred clients that shelters can pull from based on compatibility.

---

## Design Overview

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│ Caseworker   │────►│   Global Queue        │◄────│  Shelter Operator    │
│              │     │   (QUEUED referrals)  │     │  (shelter-web)       │
│ Refers client│     │                       │     │                      │
│ (open or     │     │  Each shelter sees    │     │  Views filtered      │
│  targeted)   │     │  only compatible      │     │  matches. Accepts    │
│              │     │  clients.             │     │  or declines.        │
└──────────────┘     └──────────────────────┘     └─────────────────────┘
```

---

## Architecture Decision

After evaluating four approaches (see [Alternatives Considered](#alternatives-considered)), we recommend **Option 3 — EligibilityCriterion on Referral, Shelters use existing M2Ms**.

### Core Model: `EligibilityCriterion`

A shared vocabulary model describing matchable client attributes. It is **not** a source of truth — it is a canonical list of tags used for matching.

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
        verbose_name = "Eligibility Criterion"
        verbose_name_plural = "Eligibility Criteria"

    def __str__(self) -> str:
        return f"[{self.category}] {self.name}"
```

**Pre-seeded criteria (initial set):**

| Category | Name | Maps from client field |
|---|---|---|
| DEMOGRAPHIC | `veteran` | `ClientProfile.veteran_status == YES` |
| DEMOGRAPHIC | `senior` | `ClientProfile.age >= 55` |
| DEMOGRAPHIC | `tay` | `13 <= ClientProfile.age <= 24` |
| DEMOGRAPHIC | `single_woman` | `gender == FEMALE and age >= 18` |
| DEMOGRAPHIC | `single_man` | `gender == MALE and age >= 18` |
| DEMOGRAPHIC | `lgbtq_plus` | (manual override / future field) |
| SITUATION | `domestic_violence` | (manual override / future field) |
| SITUATION | `human_trafficking` | (manual override / future field) |
| SITUATION | `justice_system` | (manual override / future field) |
| SITUATION | `hiv_aids` | (manual override / future field) |
| ACCESSIBILITY | `wheelchair_user` | `ada_accommodation includes wheelchair` |
| ACCESSIBILITY | `medical_equipment` | `ada_accommodation includes medical_equipment` |
| HOUSEHOLD | `family` | Has `ClientHouseholdMember` records |
| HOUSEHOLD | `single_parent` | Has household members + marital_status indicates single |
| HOUSEHOLD | `couple` | Has partner household member |
| PET | `has_dog_small` | (manual override) |
| PET | `has_dog_large` | (manual override) |
| PET | `has_cat` | (manual override) |
| PET | `service_animal` | (manual override) |

### Where Criteria Live

```
EligibilityCriterion ──M2M──► Referral (only)
                                │
                                │ criteria frozen at creation time
                                │
ClientProfile ◄─────────────────┘  (source fields, read once)
Shelter         (uses existing M2Ms — no criteria M2M needed)
```

**Key principle:** Criteria are stored on the **Referral**, not on the ClientProfile. This means:
- No derived data on the source-of-truth model
- No sync/signal needed on ClientProfile
- Referral captures a frozen snapshot of what was true at creation time
- Auditable: "what criteria were matched when this referral was made?"

---

## Referral Model Changes

### New Status

```python
class Referral(BaseModel):
    class Status(models.IntegerChoices):
        QUEUED = -1, "In Queue"     # NEW — waiting for shelter match
        PENDING = 0, "Pending"      # existing — targeted referral pending shelter response
        ACCEPTED = 1, "Accepted"
        DECLINED = 2, "Declined"
```

| Status | Meaning |
|---|---|
| `QUEUED` | Open referral in the global queue. `shelter` is null. Any compatible shelter can claim it. |
| `PENDING` | Targeted referral to a specific shelter. `shelter` is set. Only that shelter sees it. |
| `ACCEPTED` | A shelter has claimed this client. Removed from queue. |
| `DECLINED` | A shelter has declined. Remains visible to other shelters (if open). |

### New M2M

```python
class Referral(BaseModel):
    # ... existing fields ...
    criteria = models.ManyToManyField("EligibilityCriterion", blank=True, related_name="referrals")
```

---

## Matching Logic

### Derivation (runs once at referral creation)

```python
# referrals/criteria.py

def derive_criteria(client: ClientProfile) -> set[EligibilityCriterion]:
    """Read client fields and return matching EligibilityCriterion instances."""
    criteria_names = set()
    age = client.age  # computed property from date_of_birth

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
    # ... additional rules ...

    return set(EligibilityCriterion.objects.filter(name__in=criteria_names))
```

### Shelter Matching Query

A lookup dict (not a function) maps each criterion to the shelter M2M it should filter on:

```python
# referrals/matching.py

CRITERION_SHELTER_MAPPING: dict[str, dict] = {
    "veteran":         {"special_situation_restrictions__name": "veterans"},
    "senior":          {"demographics__name": "seniors"},
    "tay":             {"demographics__name": "tay_teen"},
    "single_woman":    {"demographics__name": "single_women"},
    "single_man":      {"demographics__name": "single_men"},
    "lgbtq_plus":      {"demographics__name": "lgbtq_plus"},
    "domestic_violence":{"special_situation_restrictions__name": "domestic_violence"},
    "human_trafficking":{"special_situation_restrictions__name": "human_trafficking"},
    "justice_system":  {"special_situation_restrictions__name": "justice_systems"},
    "hiv_aids":        {"special_situation_restrictions__name": "hiv_aids"},
    "wheelchair_user": {"accessibility__name": "wheelchair_accessible"},
    "medical_equipment":{"accessibility__name": "medical_equipment_permitted"},
    "family":          {"demographics__name__in": ["families", "single_moms", "single_dads"]},
    "single_parent":   {"demographics__name__in": ["single_moms", "single_dads"]},
    "couple":          {"demographics__name": "couples"},
    "has_dog_small":   {"pets__name": "dogs_under_25_lbs"},
    "has_dog_large":   {"pets__name": "dogs_over_25_lbs"},
    "has_cat":         {"pets__name": "cats"},
    "service_animal":  {"pets__name": "service_animals"},
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

**Why a lookup dict, not a function:**
- Data, not logic. Easy to read and audit.
- Can be moved to the database later (`CriterionShelterMapping` model) if we want admin-editable mappings.
- Adding a new criterion = 1 row in the admin + 1 line in the dict. No code deploy for the dict update (it's Python, but it's configuration, not algorithm).

---

## Acceptance Workflow (Two-Step)

```
Step 1: SHELTER CLAIMS          Step 2: CLIENT ARRIVES
──────────────                  ─────────────────────
Shelter operator clicks         Shelter staff creates
"Accept" on a queued            a Reservation via the
client.                         existing workflow.

Referral.status → ACCEPTED      Reservation links to
Referral.shelter → [shelter]    same ClientProfile.
Client removed from other
shelters' queue views.
```

**Why two steps:**
- The shelter may not know which bed is available when they claim the client.
- Bed assignment happens when the client physically arrives (hours or days later).
- The existing Reservation/check-in workflow handles the operational side — the queue is purely the matchmaking layer.

**Future enhancement:** Auto-expire accepted referrals with no Reservation created within X days (return client to queue).

---

## Notification System

### Model

```python
class NotificationFrequency(models.TextChoices):
    DAILY = "daily", "Daily"
    WEEKLY = "weekly", "Weekly"
    ON_DEMAND = "on_demand", "On Demand"

class QueueNotificationSubscription(models.Model):
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="notification_subscriptions")
    email_recipients = models.TextField(
        help_text="Comma, semicolon, space, or newline separated email addresses",
        validators=[validate_email_list],
    )
    frequency = models.CharField(choices=NotificationFrequency.choices, max_length=20, default=NotificationFrequency.DAILY)
    is_active = models.BooleanField(default=True)
    last_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("shelter",)]  # One subscription per shelter
```

### Celery Task

A periodic task that:
1. Queries all active `QueueNotificationSubscription` records due for sending
2. For each, runs the matching query (`get_matching_shelters` but in reverse — find queued clients matching the shelter)
3. Renders and sends a digest email via the existing `send-queued-mail` Celery infrastructure

---

## Frontend (shelter-web)

New routes in the shelter operator portal:

### Placement Queue Page
- **Route:** `/shelter/:id/queue`
- **View:** Table of matching queued clients (name, criteria match summary, referral date)
- **Actions:** Accept, Decline
- **Empty state:** "No matching clients in queue."
- **Permission:** Shelter operator (authenticated, associated with this shelter)

### Notification Settings Page
- **Route:** `/shelter/:id/notifications`
- **View:** Toggle subscription on/off, set frequency (daily/weekly/on-demand), manage email recipients
- **"Send Now" button:** Triggers an on-demand digest email

---

## GraphQL API Surface

### Queries
| Query | Returns | Description |
|---|---|---|
| `queueReferrals(shelterId: ID!)` | `[ReferralType!]!` | Queued referrals matching the shelter's criteria |
| `referral(pk: ID!)` | `ReferralType` | Single referral detail |
| `queueNotificationSubscription(shelterId: ID!)` | `QueueNotificationSubscriptionType` | Shelter's notification preferences |

### Mutations
| Mutation | Input | Description |
|---|---|---|
| `createReferral` | `clientProfileId, shelterId?, notes?` | Create referral (derives + freezes criteria internally) |
| `acceptReferral` | `referralId, shelterId` | Shelter claims client from queue |
| `declineReferral` | `referralId` | Shelter declines (client stays in queue for others) |
| `upsertQueueNotificationSubscription` | `shelterId, recipients, frequency, isActive` | Create/update subscription |
| `sendOnDemandNotification` | `shelterId` | Trigger immediate digest email |

### Types
```graphql
type EligibilityCriterionType {
  id: ID!
  category: EligibilityCriterionCategoryEnum!
  name: String!
  description: String
}

enum EligibilityCriterionCategoryEnum {
  DEMOGRAPHIC
  SITUATION
  ACCESSIBILITY
  HOUSEHOLD
  PET
  OTHER
}

type QueueNotificationSubscriptionType {
  id: ID!
  shelter: ShelterType!
  emailRecipients: String!
  frequency: NotificationFrequencyEnum!
  isActive: Boolean!
  lastSentAt: DateTime
}

enum NotificationFrequencyEnum {
  DAILY
  WEEKLY
  ON_DEMAND
}
```

---

## Data Flow Diagrams

### Referral Creation Flow

```
Caseworker submits referral form
         │
         ▼
┌─────────────────────────┐
│ 1. Validate input       │
│    - client exists      │
│    - shelter exists     │
│      (optional)         │
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

### Shelter Queue View Flow

```
Shelter operator opens /shelter/:id/queue
         │
         ▼
┌──────────────────────────────────────────┐
│ GraphQL: queueReferrals(shelterId)       │
│                                          │
│ Backend:                                 │
│ 1. Fetch shelter by ID                   │
│ 2. Get all QUEUED referrals              │
│    (with shelter=null)                   │
│ 3. For each referral, check if           │
│    referral's criteria match the         │
│    shelter's existing M2Ms               │
│ 4. Return matching referrals             │
└──────────────┬───────────────────────────┘
               ▼
┌──────────────────────────────────────────┐
│ Frontend displays matching clients       │
│ in a sortable/filterable table           │
└──────────────────────────────────────────┘
```

---

## Migration Plan

### New Models (no data migration needed)
1. `EligibilityCriterion` — new table, seeded via management command
2. `Referral.criteria` — new M2M through table, initially empty
3. `QueueNotificationSubscription` — new table, initially empty

### Schema Changes
1. Add `QUEUED = -1` to `Referral.Status` choices (new integer value, no existing data conflict)
2. Existing `PENDING` referrals are unaffected

### Backfill
- A management command `seed_eligibility_criteria` populates the initial criteria rows
- Existing referrals do not get criteria backfilled (they predate the queue feature)

---

## Alternatives Considered

### Option 1: Direct Query (No New Models)
Map client fields to shelter M2M filters in a Python function. Rejected: mapping function in code is hard to maintain and audit. Every new rule requires code change + deploy.

### Option 2: Unified M2M on Both Sides
`EligibilityCriterion` M2M on both Referral/ClientProfile and Shelter. Rejected: requires shelter sync signal, backfill, ongoing reconciliation between existing shelter M2Ms and the new criteria M2M. Higher complexity.

### Option 3: Criteria on Referral Only ✅ SELECTED
`EligibilityCriterion` M2M on Referral only. Shelters use existing M2Ms queried via a lookup dict. No sync, no duplication, one derivation point.

### Option 4: JSON Field on Referral
Store criteria as a JSON list on the Referral. Rejected: no referential integrity, string typos break silently, can't query criteria usage across referrals.

---

## Open Questions

1. **Should caseworkers be able to override auto-derived criteria** when creating a referral? (e.g., uncheck "senior" even though age ≥ 55)
2. **What criteria should require manual selection** vs. auto-derivation? (pets, some situations)
3. **Decline reason** — should shelters provide a reason when declining?
4. **Expiry time** — how many days before an accepted-but-not-placed referral returns to the queue?

---

## References

- Existing models: `Referral` (`referrals/models.py`), `Shelter` (`shelters/models/shelter.py`), `ClientProfile` (`clients/models.py`)
- Existing notification infrastructure: `ScheduledReport` (`reports/models.py`), Celery (`betterangels_backend/celery.py`)
- Shelter operator frontend: `shelter-web/` with existing route pattern (`shelter-web/src/app/router/`)

# Workflows: Shelter Placement Queue

## Acceptance Workflow

### Two-Step Process

The queue and the reservation system are deliberately decoupled. Claiming a client does not create a bed assignment — that happens separately when the client arrives.

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
- The queue is the **matchmaking layer**; the existing Reservation system is the **operational layer**.

### Future Enhancement

Auto-expire accepted referrals where no Reservation is created within X days. Client returns to the queue.

---

## Referral Creation Flow

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

---

## Shelter Queue View Flow

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

## Referral Lifecycle

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
        │ACCEPTED │  (visible to A, C)
        └────┬────┘
             │
             ▼
        Client arrives
             │
             ▼
        Reservation
        created
             │
             ▼
        CHECKED_IN
```

For targeted referrals (`PENDING`), the lifecycle is simpler — a single shelter can accept or decline, and decline is final (`status → DECLINED`).

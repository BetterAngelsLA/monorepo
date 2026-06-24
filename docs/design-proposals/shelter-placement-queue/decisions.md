# Key Decisions: Shelter Placement Queue

## 1. Hybrid Referral Model (Open + Targeted)

**Decision:** Referrals can be open (`QUEUED`, shelter=null) or targeted (`PENDING`, shelter set).

**Why:**
- Backward compatible — existing targeted referrals still work.
- Real-world flexibility — caseworkers sometimes know the right shelter, sometimes don't.
- The `Referral.shelter` field is already nullable — minimal schema change.

**Trade-off:** Two referral paths to support in the UI and API, but they share the same model and most logic.

---

## 2. `EligibilityCriterion` on Referral Only

**Decision:** Criteria M2M lives on the Referral, not on ClientProfile or Shelter. Shelters are queried via their existing M2Ms using a lookup dict.

**Why:**
- No sync issues — shelters own their data. No signal, no backfill, no drift.
- No derived data on source-of-truth models (ClientProfile stays clean).
- Auditable — referral captures exactly what was true at creation time.
- The lookup dict is configuration, not logic. Adding a new criterion = 1 admin row + 1 dict line.

**Trade-off:** Matching query uses OR filters per criterion rather than a single M2M intersection. Acceptable performance for current queue size; optimizable later.

**Alternatives evaluated:** See [`alternatives/`](./alternatives/index.md).

---

## 3. Two-Step Acceptance (Claim → Later Reservation)

**Decision:** When a shelter accepts a client, the referral status changes to `ACCEPTED` and the shelter FK is set. A `Reservation` is created separately when the client physically arrives.

**Why:**
- Shelters may not know which bed is available at claim time.
- Bed assignment happens at check-in, which could be hours or days later.
- The queue is the matchmaking layer; Reservation is the operational layer. Decoupling them keeps each system simple.

**Trade-off:** Two steps instead of one. Slightly more work for shelter staff, but matches real-world operations.

---

## 4. Dedicated Notification Model

**Decision:** New `QueueNotificationSubscription` model rather than extending the existing `ScheduledReport`.

**Why:**
- `ScheduledReport` is designed for organization-level scheduled data exports (monthly reports).
- Queue notifications are shelter-level, on-demand capable, and query-driven at send time.
- A dedicated model is simpler and avoids overloading `ScheduledReport` with queue-specific logic.

**Trade-off:** Another model in the codebase, but it has a single clear purpose.

---

## 5. Frontend in shelter-web (Operator Portal)

**Decision:** Queue feature lives in `shelter-web`, not `betterangels-admin`. The `betterangels` mobile app will add referral creation later.

**Why:**
- `betterangels-admin` is for system administrators.
- `shelter-web` is the shelter operator portal — the queue is a shelter operator workflow.
- Mobile referral creation follows naturally once the backend and shelter-web are in place.

**Trade-off:** Two frontend apps to build for (shelter-web now, betterangels later).

---

## 6. Global Queue (No Org Silos)

**Decision:** One global queue across all organizations. Shelters see only clients whose criteria match their acceptance profile.

**Why:**
- The goal is maximizing placements, not enforcing org boundaries.
- A shelter shouldn't be blocked from helping a client just because they're in a different org.
- Matching is attribute-driven — org membership is irrelevant to client compatibility.

**Trade-off:** No per-org data isolation. All shelters with matching criteria can see all queued clients. If data privacy requirements change, org filtering can be added later.

# Scope & Impact

## What Changes

| Component | Change |
|---|---|
| `Referral` model | New `QUEUED` status (value: -1), new `criteria` M2M to `EligibilityCriterion` |
| New: `EligibilityCriterion` | Shared vocabulary of matchable attributes (veteran, senior, family, etc.) with `category` enum |
| New: `QueueNotificationSubscription` | Per-shelter email digest settings (frequency, recipients, active toggle) |
| `shelter-web` | New Queue page (`/shelter/:id/queue`) + Notification Settings page (`/shelter/:id/notifications`) |
| `betterangels` mobile | Future: caseworker referral creation with role-based permissions |
| `referral_create` service | Extended to call `derive_criteria()` and freeze criteria on the referral |
| GraphQL schema | New types (`EligibilityCriterionType`, `QueueNotificationSubscriptionType`), new queries/mutations |

## What Does NOT Change

| Component | Impact |
|---|---|
| `ClientProfile` | No new fields, no derived data stored, no signals |
| `Shelter` existing M2Ms | `demographics`, `accessibility`, `special_situation_restrictions`, `pets`, etc. remain the source of truth |
| `Reservation` workflow | Placements still go through the existing check-in system |
| `betterangels-admin` | No changes — queue is a shelter operator feature, not an admin feature |
| `Bed` / `Room` models | No changes |
| Existing `PENDING` / `ACCEPTED` / `DECLINED` referrals | Unaffected — `QUEUED` is a new status value, no backfill needed |

## Migration Impact

| Change | Type | Risk |
|---|---|---|
| `EligibilityCriterion` table | New table | None — seeded by management command |
| `Referral.criteria` M2M | New through table | None — initially empty |
| `Referral.Status.QUEUED = -1` | New integer choice | None — no conflict with existing 0/1/2 |
| `QueueNotificationSubscription` table | New table | None — initially empty |

No data migration required. Existing functionality is untouched.

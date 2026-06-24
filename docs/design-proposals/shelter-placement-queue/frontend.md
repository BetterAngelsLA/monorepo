# Frontend: Shelter Placement Queue

## App: `shelter-web` (Shelter Operator Portal)

This feature lives in the **shelter operator portal** (`apps/shelter-web/`), not in `betterangels-admin` (which is for system administrators).

---

## Routes

| Route | Page | Purpose |
|---|---|---|
| `/shelter/:id/queue` | Placement Queue | View matching queued clients, accept/decline |
| `/shelter/:id/notifications` | Notification Settings | Manage email subscription preferences |

### Route Integration

New routes follow the existing pattern in `shelter-web/src/app/router/`:

```tsx
// New route constants (in @monorepo/react/shelter or local)
export const shelterQueuePath = "/shelter/:id/queue";
export const shelterNotificationsPath = "/shelter/:id/notifications";

// In buildShelterRoutes.tsx
<Route
  key={shelterQueuePath}
  path={shelterQueuePath}
  element={<QueueRoute />}
/>
<Route
  key={shelterNotificationsPath}
  path={shelterNotificationsPath}
  element={<NotificationSettingsRoute />}
/>
```

---

## Placement Queue Page (`/shelter/:id/queue`)

### Purpose

A shelter operator views all queued clients whose criteria match their shelter. They can accept (claim) or decline each client.

### Page States

| State | What the user sees |
|---|---|
| **Loading** | Skeleton/spinner while GraphQL query runs |
| **Empty** | "No matching clients in the queue right now. Check back later or adjust your shelter's acceptance criteria." |
| **Results** | Table of matching clients with accept/decline actions |
| **Error** | Error message with retry option |

### Table Columns

| Column | Source |
|---|---|
| **Name** | `clientProfile.firstName clientProfile.lastName` |
| **Match** | e.g., "4 of 6 criteria" (`matchCount` / `criteria.length`) |
| **Key criteria** | First 3-4 matching criteria names as badges |
| **Referred** | `createdAt` formatted as relative date ("2 days ago") |
| **Actions** | [Accept] [Decline] buttons |

### Row Click

Clicking a row navigates to a detail panel or expandable row showing:
- Full list of matching criteria (with category grouping)
- Client summary (age, gender, veteran status)
- All criteria on the referral (matching and non-matching)
- Notes from the referral

### Accept Flow

```
[Click Accept]
      │
      ▼
┌─────────────────────┐
│ Confirmation modal   │
│ "Claim this client  │
│  for [Shelter Name]?"│
│ [Cancel] [Confirm]   │
└─────────┬───────────┘
          ▼ (Confirm)
┌─────────────────────┐
│ acceptReferral()     │
│ mutation             │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Success toast:       │
│ "Client claimed.     │
│  Create reservation  │
│  when they arrive."  │
│                      │
│ Client row removed   │
│ from queue view      │
└─────────────────────┘
```

### Decline Flow

```
[Click Decline]
      │
      ▼
┌─────────────────────┐
│ Confirmation modal   │
│ "Decline this client?│
│  They'll remain      │
│  visible to other    │
│  shelters."          │
│ [Cancel] [Decline]   │
└─────────┬───────────┘
          ▼ (Confirm)
┌─────────────────────┐
│ declineReferral()    │
│ mutation             │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Client row hidden    │
│ from this shelter's  │
│ queue view           │
│ (but stays in queue  │
│  for others)         │
└─────────────────────┘
```

---

## Notification Settings Page (`/shelter/:id/notifications`)

### Purpose

Shelter operator enables/disables email notifications about new matching clients in the queue, sets delivery frequency, and manages recipient emails.

### Form Fields

| Field | Type | Default |
|---|---|---|
| **Enable notifications** | Toggle | `false` |
| **Frequency** | Select: Daily / Weekly / On Demand | `Daily` |
| **Email recipients** | Textarea (comma/space/newline separated) | Pre-populated from shelter contact email if exists |
| **Last sent** | Read-only timestamp | — |

### Actions

| Action | Behavior |
|---|---|
| **Save** | `upsertQueueNotificationSubscription` mutation |
| **Send Now** | `sendOnDemandNotification` mutation → toast with match count |

### Page States

| State | Behavior |
|---|---|
| **No subscription yet** | Form defaults, "Save" button creates first subscription |
| **Existing subscription** | Pre-populated form, "Save" updates |
| **Loading** | Skeleton form |
| **Save success** | Toast "Notification settings saved." |
| **Send Now success** | Toast "Digest sent with N matching clients." |
| **Send Now empty** | Toast "No matching clients in queue right now." |

---

## Component Hierarchy

```
QueueRoute
├── QueueHeader
│   ├── Title: "Placement Queue"
│   └── Link to Notification Settings
├── QueueTable
│   ├── QueueTableRow (per referral)
│   │   ├── ClientName
│   │   ├── MatchBadge (criteria count)
│   │   ├── CriteriaBadgeList
│   │   ├── RelativeDate
│   │   └── ActionButtons
│   │       ├── AcceptButton
│   │       └── DeclineButton
│   └── EmptyState
├── AcceptModal (shared)
└── DeclineModal (shared)

NotificationSettingsRoute
├── NotificationForm
│   ├── ToggleField (isActive)
│   ├── SelectField (frequency)
│   ├── TextareaField (recipients)
│   ├── ReadOnlyField (lastSentAt)
│   ├── SaveButton
│   └── SendNowButton
└── EmptyState (no subscription yet)
```

---

## GraphQL Integration

The frontend uses auto-generated hooks from the GraphQL schema. New operations:

```
operations/
├── queueReferrals.graphql        # query queueReferrals($shelterId: ID!)
├── acceptReferral.graphql        # mutation acceptReferral($data: AcceptReferralInput!)
├── declineReferral.graphql       # mutation declineReferral($data: DeclineReferralInput!)
├── queueNotificationSubscription.graphql  # query
├── upsertQueueNotificationSubscription.graphql  # mutation
└── sendOnDemandNotification.graphql  # mutation
```



## Future: `betterangels` Mobile App (Expanded)

### Caseworker Referral Creation

The `betterangels` Expo/React Native app will support referral creation for caseworkers in the field. This is a follow-up to the initial shelter-web implementation.

**Role-based access:**

| Role | Can create referrals? | Notes |
|---|---|---|
| Caseworker | Yes | Core workflow - refer clients into the queue |
| Shelter operator | No | Shelter operators manage the queue from shelter-web |
| Admin | Yes | Can create referrals for any client |
| Read-only | No | View only |

Caseworkers authenticate via the mobile app and are permissioned through their `PermissionGroup` membership. The `createReferral` mutation is gated on `Referral.perms.ADD`, which is granted to caseworker roles.

**Mobile referral creation flow:**

1. Caseworker opens client profile in mobile app
2. "Refer to Queue" button (visible if user has ADD permission on Referral)
3. Referral form: shelter (optional picker), notes, criteria preview (auto-derived, read-only)
4. `createReferral` mutation - criteria frozen, status QUEUED or PENDING
5. Confirmation screen

**Mobile-specific considerations:**
- Offline-capable queue creation (later iteration)
- Simplified UI: minimal fields, criteria auto-derived
- Push notification: caseworker notified when their referral is accepted (later iteration)

---

## Future: Shelter Intake (On-Site)

### Concept

When a client walks up to a shelter (not through the queue), shelter staff can do an **on-site intake** directly in shelter-web or the betterangels mobile app:

1. Search for existing client profile or create a new one
2. Complete intake form (collect/verify required info)
3. Create a Reservation directly (bypassing the queue)
4. Client is checked in

### Relationship to the Queue

| Pathway | Entry point | Flow |
|---|---|---|
| **Queue placement** | Caseworker creates referral -> queue -> shelter claims -> Reservation | Queue-mediated |
| **Walk-up / intake** | Client arrives at shelter -> intake form -> Reservation | Direct |
| **Queue + intake** | Shelter claims from queue -> client arrives -> intake form -> Reservation | Combined |

The queue and intake are complementary:
- **Queue:** For caseworkers referring clients they cannot place directly
- **Intake:** For shelters processing walk-ups and completing check-in for queued clients who have arrived

### Future Integration

- When a shelter opens a claimed referral, the intake form can be pre-populated from the client profile
- Intake can collect additional criteria not auto-derived (pets, special situations)
- The intake flow can feed back into the criteria system

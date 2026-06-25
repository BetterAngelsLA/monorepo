# Frontend: Shelter Placement Queue

## App: `shelter-web` (Shelter Operator Portal)

This feature lives in the **shelter operator portal** (`apps/shelter-web/`), not
in `betterangels-admin` (which is for system administrators).

---

## Routes

| Route | Page | Purpose |
|---|---|---|
| `/shelter/:id/queue` | Placement Queue | View matching queued clients, accept/decline |

### Route Integration

New route follows the existing pattern in `shelter-web/src/app/router/`:

```tsx
export const shelterQueuePath = "/shelter/:id/queue";

// In buildShelterRoutes.tsx
<Route
  key={shelterQueuePath}
  path={shelterQueuePath}
  element={<QueueRoute />}
/>
```

---

## Placement Queue Page (`/shelter/:id/queue`)

### Purpose

A shelter operator views all queued clients whose frozen attributes match their
shelter's acceptance profile. They can accept (claim) or decline each client.

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
| **Priority** | `priority` — color-coded badge (red=Urgent, yellow=Elevated, grey=Standard) |
| **Name** | `clientProfile.firstName clientProfile.lastName` |
| **Population** | `population` badge (Adult/Family/TAY) |
| **Match** | e.g., "4 of 7" — `matchCount` / total possible attributes |
| **Matched attributes** | Derived from boolean fields — e.g., "Veteran, Senior, Family" as badges |
| **Referred** | `createdAt` formatted as relative date ("2 days ago") |
| **Actions** | [Accept] [Decline] buttons |

### Attribute Display

Instead of showing an abstract "criteria" list, the UI shows concrete,
human-readable labels derived from the boolean fields:

```
isVeteran         → "Veteran"
isSenior          → "Senior (55+)"
isTay             → "TAY (18-24)"
isFamily          → "Family"
isSingleWoman     → "Single Woman"
isSingleMan       → "Single Man"
isWheelchairUser  → "Wheelchair User"
hasMedicalEquipment → "Medical Equipment"
```

Manual tags (e.g., `"domestic_violence"`, `"has_dog_small"`) are displayed as
labeled badges alongside the boolean-derived labels.

### Row Click / Detail Panel

Clicking a row expands to show:
- All matching attributes (with checkmarks for matched, dashes for unmatched)
- Client summary (age, gender, veteran status)
- Manual tags on the referral
- Notes from the referral
- Decline history (which shelters declined and when)

### Accept Flow

```
[Click Accept]
      |
      v
+---------------------+
| Confirmation modal   |
| "Claim this client  |
|  for [Shelter Name]?"|
| [Cancel] [Confirm]   |
+---------+-----------+
          v (Confirm)
+---------------------+
| acceptReferral()     |
| mutation             |
+---------+-----------+
          v
+---------------------+
| Success toast:       |
| "Client claimed.     |
|  Create reservation  |
|  when they arrive."  |
|                      |
| Client row removed   |
| from queue view      |
+---------------------+
```

### Decline Flow

```
[Click Decline]
      |
      v
+---------------------+
| Decline modal        |
|                      |
| Reason (optional):   |
| [________________]   |
|                      |
| "They'll remain      |
|  visible to other    |
|  shelters."          |
| [Cancel] [Decline]   |
+---------+-----------+
          v (Confirm)
+---------------------+
| declineReferral()    |
| mutation             |
+---------+-----------+
          v
+---------------------+
| Client row hidden    |
| from this shelter's  |
| queue view           |
| (but stays in queue  |
|  for others)         |
+---------------------+
```

---

## Component Hierarchy

```
QueueRoute
+-- QueueHeader
|   +-- Title: "Placement Queue"
|   +-- Population filter tabs: [All | Adult | Family | TAY]
+-- QueueTable
|   +-- QueueTableRow (per referral)
|   |   +-- PriorityBadge
|   |   +-- ClientName
|   |   +-- PopulationBadge
|   |   +-- MatchCount ("4 of 7")
|   |   +-- AttributeBadgeList (matched attributes as badges)
|   |   +-- RelativeDate
|   |   +-- ActionButtons
|   |       +-- AcceptButton
|   |       +-- DeclineButton
|   +-- EmptyState
+-- AcceptModal (shared)
+-- DeclineModal (with optional reason field)
```

---

## What's Deferred

| Feature | Rationale |
|---|---|
| **Notification Settings page** (`/shelter/:id/notifications`) | Queue email digests are deferred to v2. See proposal.md "What's Deferred" section. |
| **Caseworker referral creation** (betterangels mobile) | Future: mobile app will expose `createReferral` mutation with population, priority, and manualTags inputs. |

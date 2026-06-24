# API: Shelter Placement Queue

## GraphQL Schema

All new types are under the existing `referrals` and `shelters` Strawberry Django apps.

---

## Types

### EligibilityCriterionType

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
```

### QueueNotificationSubscriptionType

```graphql
type QueueNotificationSubscriptionType {
  id: ID!
  shelter: ShelterType!
  emailRecipients: String!
  frequency: NotificationFrequencyEnum!
  isActive: Boolean!
  lastSentAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum NotificationFrequencyEnum {
  DAILY
  WEEKLY
  ON_DEMAND
}
```

### ReferralType (Extended)

Existing `ReferralType` gains a new field:

```graphql
type ReferralType {
  # ... existing fields ...
  criteria: [EligibilityCriterionType!]!
}
```

The `status` field now includes `QUEUED`:

```graphql
enum ReferralStatusEnum {
  QUEUED      # NEW
  PENDING
  ACCEPTED
  DECLINED
}
```

---

## Queries

### `referrals` (Updated)

Existing paginated query. Filter extended to support queue-specific filters:

```graphql
query {
  referrals(
    filters: {
      status: QUEUED           # filter by status
      shelter: null            # open referrals only
    }
  ) {
    results {
      id
      status
      criteria { name category }
      clientProfile { firstName lastName age }
      createdAt
    }
  }
}
```

### `queueReferrals` (New)

Shelter-specific query: returns queued referrals matching the shelter's criteria.

```graphql
query($shelterId: ID!) {
  queueReferrals(shelterId: $shelterId) {
    id
    status
    criteria { name category }
    clientProfile {
      id
      firstName
      lastName
      age
      gender
      veteranStatus
      # ... summary fields only, not full profile
    }
    createdAt
    # Number of overlapping criteria with the shelter
    matchCount
  }
}
```

**Backend implementation:**
1. Fetch shelter by ID
2. Get all referrals with `status=QUEUED` and `shelter__isnull=True`
3. For each referral, run `get_matching_shelters()` and include if the requested shelter is in the results
4. Annotate each result with `matchCount` (number of criteria that overlap)

**Performance note:** This query iterates over queued referrals. If the queue grows large (>1000), we should add a reverse index — precompute which criteria each shelter matches against and query referrals by criteria membership. This can be added later without API changes.

### `queueNotificationSubscription` (New)

```graphql
query($shelterId: ID!) {
  queueNotificationSubscription(shelterId: $shelterId) {
    id
    emailRecipients
    frequency
    isActive
    lastSentAt
  }
}
```

Returns `null` if no subscription exists for the shelter.

---

## Mutations

### `createReferral` (Updated)

Existing mutation. Extended to derive criteria internally:

```graphql
mutation($data: CreateReferralInput!) {
  createReferral(data: $data) {
    id
    status
    criteria { name category }
    ... on OperationInfo {
      messages { kind field message }
    }
  }
}
```

```graphql
input CreateReferralInput {
  clientProfile: ID!
  shelter: ID                # Optional — null = open/QUEUED
  notes: String
}
```

**Backend behavior:**
1. Validate client exists
2. Validate shelter exists (if provided)
3. `derive_criteria(client)` → set criteria M2M
4. `status = QUEUED` if shelter is null, `PENDING` if shelter is set
5. Save and return

### `acceptReferral` (New)

Shelter claims a client from the queue:

```graphql
mutation($data: AcceptReferralInput!) {
  acceptReferral(data: $data) {
    id
    status
    shelter { id name }
    ... on OperationInfo {
      messages { kind field message }
    }
  }
}
```

```graphql
input AcceptReferralInput {
  referralId: ID!
  shelterId: ID!
}
```

**Backend behavior:**
1. Verify referral exists and status is `QUEUED` or `PENDING`
2. Verify `shelterId` matches the referral's criteria (prevent claiming incompatible clients)
3. Set `referral.status = ACCEPTED`
4. Set `referral.shelter = shelter`
5. Save and return

### `declineReferral` (New)

Shelter declines a client:

```graphql
mutation($data: DeclineReferralInput!) {
  declineReferral(data: $data) {
    id
    status
    ... on OperationInfo {
      messages { kind field message }
    }
  }
}
```

```graphql
input DeclineReferralInput {
  referralId: ID!
}
```

**Backend behavior:**
1. Verify referral is in the requesting shelter's queue
2. If referral was targeted (`PENDING` → specific shelter), set `status = DECLINED`
3. If referral was open (`QUEUED`), **leave status as QUEUED** — other shelters can still claim it
4. Optionally record decline reason (future field)

### `upsertQueueNotificationSubscription` (New)

```graphql
mutation($data: UpsertQueueNotificationSubscriptionInput!) {
  upsertQueueNotificationSubscription(data: $data) {
    id
    emailRecipients
    frequency
    isActive
    ... on OperationInfo {
      messages { kind field message }
    }
  }
}
```

```graphql
input UpsertQueueNotificationSubscriptionInput {
  shelterId: ID!
  emailRecipients: String!
  frequency: NotificationFrequencyEnum!
  isActive: Boolean!
}
```

Creates or updates the subscription for the given shelter. One subscription per shelter (enforced by `unique_together`).

### `sendOnDemandNotification` (New)

Triggers an immediate digest email:

```graphql
mutation($data: SendOnDemandNotificationInput!) {
  sendOnDemandNotification(data: $data) {
    success: Boolean!
    matchCount: Int
    ... on OperationInfo {
      messages { kind field message }
    }
  }
}
```

```graphql
input SendOnDemandNotificationInput {
  shelterId: ID!
}
```

---

## Permissions

| Operation | Permission |
|---|---|
| `createReferral` | `Referral.perms.ADD` (caseworker) |
| `queueReferrals` | `Referral.perms.VIEW` (shelter operator for their shelter) |
| `acceptReferral` | `Referral.perms.CHANGE` (shelter operator for their shelter) |
| `declineReferral` | `Referral.perms.CHANGE` (shelter operator for their shelter) |
| `upsertQueueNotificationSubscription` | Shelter operator for their shelter |
| `sendOnDemandNotification` | Shelter operator for their shelter |

---

## Error Handling

All mutations return `OperationInfo` messages for validation errors:

| Scenario | Error |
|---|---|
| Client not found | `{field: "clientProfile", message: "Client profile not found."}` |
| Shelter not found | `{field: "shelter", message: "Shelter not found."}` |
| Accepting incompatible client | `{field: "shelterId", message: "This shelter does not match the client's criteria."}` |
| Referral already accepted | `{field: "referralId", message: "This referral has already been accepted."}` |
| Invalid email recipients | `{field: "emailRecipients", message: "Invalid email address: ..."}` |

# API: Shelter Placement Queue

## GraphQL Schema

All new types are under the existing `referrals` and `shelters` Strawberry Django apps.

---

## Types

### ReferralType (Extended)

Existing `ReferralType` gains new fields for frozen matchable attributes:

```graphql
type ReferralType {
  # ... existing fields (id, clientProfile, shelter, createdBy, organization, notes, createdAt) ...

  # ── New: segmentation + prioritization ──
  population: PopulationEnum!
  priority: PriorityEnum!

  # ── New: frozen matchable attributes (derived once from ClientProfile) ──
  isVeteran: Boolean!
  isSenior: Boolean!
  isTay: Boolean!
  isFamily: Boolean!
  isSingleWoman: Boolean!
  isSingleMan: Boolean!
  isWheelchairUser: Boolean!
  hasMedicalEquipment: Boolean!

  # ── New: manual-only criteria tags ──
  manualTags: [String!]!

  # ── New: decline history ──
  declines: [ReferralDeclineType!]!
}

enum PopulationEnum {
  ADULT
  FAMILY
  TAY
}

enum PriorityEnum {
  STANDARD
  ELEVATED
  URGENT
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

### ReferralDeclineType (New)

```graphql
type ReferralDeclineType {
  id: ID!
  shelter: ShelterType!
  declinedBy: UserType
  reason: String
  createdAt: DateTime!
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
      status: QUEUED
      shelter: null
      population: FAMILY        # optional pre-filter
      isVeteran: true           # optional attribute filter
    }
  ) {
    results {
      id
      status
      population
      priority
      isVeteran
      isSenior
      isFamily
      manualTags
      clientProfile { firstName lastName age }
      createdAt
    }
  }
}
```

### `queueReferrals` (New)

Shelter-specific query: returns queued referrals matching the shelter's criteria,
sorted by priority then match count.

```graphql
query($shelterId: ID!) {
  queueReferrals(shelterId: $shelterId) {
    id
    status
    population
    priority
    isVeteran
    isSenior
    isTay
    isFamily
    isSingleWoman
    isSingleMan
    isWheelchairUser
    hasMedicalEquipment
    manualTags
    clientProfile {
      id
      firstName
      lastName
      age
      gender
      veteranStatus
    }
    createdAt
    matchCount         # Number of attributes matching this shelter
  }
}
```

**Backend implementation:**
1. Fetch shelter by ID
2. Get all referrals with `status=QUEUED` and `shelter__isnull=True`
3. For each referral, run `get_matching_shelters()` and include if the requested shelter is in the results
4. Compute `matchCount` by counting how many of the referral's boolean attributes + manual tags overlap with the shelter's M2Ms
5. Sort by priority descending, then matchCount descending, then created_at ascending

### `referralDeclines` (New)

```graphql
query($referralId: ID!) {
  referralDeclines(referralId: $referralId) {
    id
    shelter { id name }
    declinedBy { id firstName lastName }
    reason
    createdAt
  }
}
```

---

## Mutations

### `createReferral` (Updated)

```graphql
mutation($data: CreateReferralInput!) {
  createReferral(data: $data) {
    id
    status
    population
    priority
    isVeteran
    isSenior
    isFamily
    manualTags
    ... on OperationInfo {
      messages { kind field message }
    }
  }
}
```

```graphql
input CreateReferralInput {
  clientProfile: ID!
  shelter: ID                    # Optional — null = open/QUEUED
  population: PopulationEnum!    # adult, family, tay
  priority: PriorityEnum         # Defaults to STANDARD
  manualTags: [String!]          # e.g. ["domestic_violence", "has_dog_small"]
  notes: String
}
```

**Backend behavior:**
1. Validate client exists
2. Validate shelter exists (if provided)
3. `derive_referral_attrs(client)` → set boolean fields
4. Validate `manualTags` against known tag set
5. `status = QUEUED` if shelter is null, `PENDING` if shelter is set
6. Save and return

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
2. Verify shelter matches the referral (prevent claiming incompatible clients)
3. Set `referral.status = ACCEPTED`, `referral.shelter = shelter`
4. Save and return

### `declineReferral` (New)

Shelter declines a client:

```graphql
mutation($data: DeclineReferralInput!) {
  declineReferral(data: $data) {
    id
    status
    declines { shelter { id name } reason createdAt }
    ... on OperationInfo {
      messages { kind field message }
    }
  }
}
```

```graphql
input DeclineReferralInput {
  referralId: ID!
  reason: String                # Optional decline reason
}
```

**Backend behavior:**
1. Verify referral is in the requesting shelter's queue view
2. If referral was targeted (`PENDING`), set `status = DECLINED`
3. If referral was open (`QUEUED`), create a `ReferralDecline` record (with timestamp and optional reason). Referral stays `QUEUED` for other shelters.

---

## Permissions

| Operation | Permission |
|---|---|
| `createReferral` | `Referral.perms.ADD` (caseworker) |
| `queueReferrals` | `Referral.perms.VIEW` (shelter operator for their shelter) |
| `acceptReferral` | `Referral.perms.CHANGE` (shelter operator for their shelter) |
| `declineReferral` | `Referral.perms.CHANGE` (shelter operator for their shelter) |

---

## Error Handling

All mutations return `OperationInfo` messages for validation errors:

| Scenario | Error |
|---|---|
| Client not found | `{field: "clientProfile", message: "Client profile not found."}` |
| Shelter not found | `{field: "shelter", message: "Shelter not found."}` |
| Accepting incompatible client | `{field: "shelterId", message: "This shelter does not match the client's criteria."}` |
| Referral already accepted | `{field: "referralId", message: "This referral has already been accepted."}` |
| Invalid manual tag | `{field: "manualTags", message: "Unknown tag: ..."}` |
| Duplicate QUEUED referral | `{field: "clientProfile", message: "Client already has an open referral."}` |

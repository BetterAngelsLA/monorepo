# Permission surface redesign — record-centric reach (proposal + roadmap)

**Status:** proposal, under review in [PR #2414] (grant-reachability). Supersedes the
effective-per-org / per-org-list direction discussed earlier in that thread — that
direction was still org-centric. This document is the target and the path to it.

## 1. The problem — the personas

| Persona | What they do | Reach |
|---|---|---|
| Org shelter operator | shelter / bed / room CRUD | their org |
| Global Shelter Operator (GSO) | shelter / bed / room CRUD | any / all orgs |
| Org note editor (caseworker) | note/task work on clients | their org's notes + shared clients |
| Global note editor | note/task work | every org + shared clients |

The operations are **identical across all four — only reach differs**. And org itself
is a soft administrative grouping: `Shelter.organization` is nullable, `ClientProfile`
has **no org at all**, and note/client reads are deliberately cross-org (product
decision, `docs/teams_org_scoping.md`).

An "active org + `X-Organization-ID` header + switcher + platform mode + per-org
permission lists" contract is a client state machine expressing something that was
never org-shaped. It carries three standing costs:

1. **The header breaks the Apollo cache** — org is invisible to the cache key, so two
   orgs' identical queries collide (stale cross-org data).
2. **The FE recomputes authority** — it unions `global ∪ org-scoped` and maintains a
   parallel `PermissionEnum`, i.e. a second source of truth that drifts.
3. **Two write semantics coexist** (ADR §2.6) — active-org-confined entity services vs
   identity-wide `can()`/`can_obj()`. One FE contract cannot represent both honestly.

## 2. Target: reach-shaped capability

> **Org is a property of data, not a place the user stands.**

- **Reads** return exactly the user's *reach*: `visible(qs, perm, in_org=orgId?)`
  over their full authority (org grants + global tier + per-record grants). No header,
  no active-org context. `orgId` is an optional *filter* (a GraphQL variable, so it is
  part of the cache key). `null` = full reach: a caseworker sees their org's notes +
  shared clients; a GSO sees everything; "global" is just more rows in one list.
- **Creates** take org as a **required input** for row-less org-owned rows
  (`createShelter(organizationId: ID!)`), populated by "orgs where I can ADD" — which
  is also the button's gate, so the button and the picker cannot disagree.
- **Row-scoped mutations** resolve org from the **resource** (`updateShelter(id)` →
  `shelter.organization` → `can()`; `updateNote(id)` → note org + per-record grant →
  `can_obj()`). One check serves every persona; no branch, no header.
- **Org-admin screens** (members / teams / reports) take org as a **page parameter**
  (`orgId` variable); their booleans (`canManageMembers`, …) are resolved server-side
  for that one org.

### 2.1 How the FE learns what to render — capability at the granularity authority varies

Stress-tested against production authorization systems (Zanzibar, OpenFGA, SpiceDB,
GitHub GraphQL):

- Zanzibar/OpenFGA model authority as subject–action–object tuples; UI guidance is
  **Check** per object, **Batch Check** for "every relation necessary to show/hide
  each field," and **ListObjects** for access-filtering collections. Object checks
  resolve through parent scopes (userset rewrites; here shelter→org).
- GitHub GraphQL ships `viewerCanUpdate` / `viewerCanDelete` **on objects** where
  viewer authority varies per object.
- No source recommends shipping tenant-wide permission lists to a client.

Conclusion — match the signal to where authority actually varies:

| Data shape | Authority varies by | Capability signal |
|---|---|---|
| Shelter / Room / Bed (org-uniform, no per-record grants) | **org** — every row in org X has the same `canChange` | per-scope action set for the screen's orgs (a handful of booleans), or per-row batch checks that resolve uniformly — pick the cheaper wire |
| Caseworker notes (edit own/assigned only) | **row** (per-record CHANGE/DELETE) | per-row flags (object-grant `Exists` / batch check) |
| Shared clients (platform-shared, object grants) | **row** | per-row flags |
| Teams / members / reports (org-admin) | **org** | screen-level booleans resolved for the administered org |
| Org-less actions (nav, HMIS, superuser) | — | `currentUser.permissions` (global tier, small) |

Wire sketch:

```graphql
type CurrentUserType {
  permissions: [String!]!        # global tier ONLY — org-less actions
  organizations: [UserOrg!]!     # metadata for filters/pickers — NO permission lists
}
type UserOrg { id: ID name: String! isMember: Boolean! roleNames: [String!]! }

# Org-uniform lists: rows + a per-scope action map (buttons derive from row.org)
query ShelterWorkspace($orgFilter: ID) {
  orgActions { org { id name } canChangeShelters: Boolean! canAddBeds: Boolean! }
  shelters(orgFilter: $orgFilter) { id name org { id name } }   # plain rows
}

# Per-record lists: rows carry viewer-can flags (batch-checked / Exists)
query Notes($clientId: ID!) {
  notes(clientId: $clientId) { id body canChange: Boolean! canDelete: Boolean! }
}
```

### 2.2 Concrete surface — the shelter workspace, end to end

Both personas land on the same screen: a **shelter workspace** — a list of shelters
drawn from *everything the user can reach*, optionally narrowed by an `orgFilter`.
No org switcher, no header. Rows carry their org as data.

**Query**

```graphql
query ShelterWorkspace($orgFilter: ID) {
  orgCapabilities {                # one small card per org that appears in the list
    orgId: ID!
    canEditShelters: Boolean!      # can(user, Shelter.CHANGE, org)
    canDeleteShelters: Boolean!    # can(user, Shelter.DELETE, org)
    canAddRooms: Boolean!          # can(user, Room.ADD, org)
    canAddBeds: Boolean!           # can(user, Bed.ADD, org)
  }
  shelters(orgFilter: $orgFilter) { id name org { id name } }   # plain rows
}
```

Why org-uniform rows don't need per-row flags: authority is constant per org (an
operator edits every shelter in their org), so one boolean per org replaces one per
row. Global holders simply read `true` in every org's card.

**Backend**

- Rows: `visible(Shelter.objects.all(), user, VIEW, in_org=$orgFilter)` — an absent
  filter means the user's whole reach (already the predicate's behavior).
- Capability cards: each boolean is a membership test in `scopes(user, <perm>)`
  (`ALL` for global holders) — the same decision `can()` makes. Four set lookups per
  request, not per row:

```python
def org_capabilities(user, org_ids):
    change = set(scopes(user, Shelter.perms.CHANGE))  # empty for a non-holder
    is_all = lambda s: s == {ALL}                     # global tier ⇒ every org
    return [
        {
            "orgId": oid,
            "canEditShelters": is_all(change) or oid in change,
            "canDeleteShelters": is_all(delete) or oid in delete,
            "canAddRooms": is_all(add_room) or oid in add_room,
            "canAddBeds": is_all(add_bed) or oid in add_bed,
        }
        for oid in org_ids
    ]
```

**Frontend** — the only FE "state" is a tiny id→card map built from the response:

```tsx
const caps = new Map(orgCapabilities.map(c => [c.orgId, c]));

function ShelterRow({ shelter }: { shelter: Shelter }) {
  const can = caps.get(shelter.org.id);
  return (
    <div>
      {shelter.name}
      {can?.canEditShelters && <button>Edit</button>}
      {can?.canDeleteShelters && <button>Delete</button>}
      {can?.canAddRooms && <button>+ Room</button>}
      {can?.canAddBeds && <button>+ Bed</button>}
    </div>
  );
}
```

A row's buttons come from *its org's card*. Alice (scoped operator) sees buttons only
on org-h rows; Sam (GSO) sees them on every org's rows. Neither FE asks "which org am
I in".

**Mutations** — no org in the call; the resource supplies it:

```graphql
mutation { updateShelter(id: "1", ...) }          # org = shelter.organization → can() → 200 / 404
mutation { addBed(roomId: "...", ...) }           # org = room.shelter.organization → can()
mutation { createShelter(organizationId: "org-h", ...) }  # row-less create: org is an input
```

The create button and its org picker come from the same data: "orgs where I can
ADD" (a per-org boolean resolved server-side), so the gate and the picker cannot
disagree.

**Drill-down** (shelter detail → rooms → beds) is the same pattern: rooms/beds are
org-uniform, so the detail query carries the same org card and every add/edit
affordance resolves against it. Per-record models (caseworker notes, shared clients)
are the exception — their rows carry per-row `canChange`/`canDelete` flags instead
(§2.1), because authority genuinely varies per row there.

### 2.3 What this deletes

- The `X-Organization-ID` header from the addressing/authz path (and its cache bug).
- The active-org provider / switcher-as-authority / "platform mode".
- `organizationsOrganization[].permissions` (per-org permission lists) and the FE
  union rule (`global || org`).
- The dual write semantic (strict-vs-union) — one rule: **authorize against the
  resource**.

### 2.4 Honest costs

- GSO list reads are platform-wide → pagination + org-as-filter (already exist).
- Per-record flags need a small, whitelisted vocabulary per model (`canChange` /
  `canDelete` / …) — never a generic `can(permission)` field.
- The migration is the real price: every header/org-context consumer moves domain by
  domain (see §4).

## 3. Delta from the current stack

| Piece | Current | Target |
|---|---|---|
| Authority model (roles/grants/global tier, predicate) | ✅ the foundation | unchanged — already Zanzibar-shaped |
| Read confinement | header org (`active_org(info)`) | `orgId` variable filter; `null` = full reach |
| Write org source | header (`get_current_organization`) | from the row / explicit input |
| FE context | active-org provider + per-org perm lists + union | orgs-as-metadata + filter state; per-scope/per-row capability |
| Per-record surfacing (tier 3) | deferred to clients cutover | required earlier for notes/clients (per-row flags) |
| Header plumbing | everywhere | deleted at the end |

## 4. The path — each step green and independently mergeable

**Not one PR.** The change can't be a big-bang: un-landed prerequisites (notes
cutover, §5.3 org-admin milestone #2427–#2435, fail-closed `can_obj`), a review
surface spanning every domain + both FE apps, and an FE/BE lockstep that requires the
transitional dual-read pattern. Instead:

| Step | What | Ships as |
|---|---|---|
| 0 | **Decide the design** (this document / RFC) | review thread |
| 1 | Backend mechanics on **shelters**: row-derived org in services; list reads take `orgId` variable (null = reach); header kept as transitional default | 1 backend PR, off main (no conflict with in-flight stack), FE unaffected |
| 2..N | Same mechanics per remaining domain — **folded into each cutover** if accepted early (teams/reports/members via #2427+; notes/clients later), else small retros | rides existing per-domain PRs |
| FE-1 | `ba-platform` contract swap: drop active-org context + per-org perm lists → metadata orgs + filter state; queries use `orgId` variables; mutations rely on backend row-derived org | 1 FE-lib PR (backend accepts both paths during transition) |
| FE-2..N | Migrate screens per app (admin, shelter-operator); per-row flags for notes/clients | per-app PRs |
| Final | Delete header plumbing + old perm-list fields once nothing consumes them | deletion PR, grep-verifiable |

## 5. First PR (concrete candidate — start now)

Shelters-only, off `main`:

- `shelters/selectors/operator.py` — `shelter_queryset`/`room_queryset`/`bed_queryset`
  accept `org_id` from the operation (variable); resolvers stop treating
  `active_org(info)` as the source of truth.
- `shelters/schema.py` — mutations resolve org from the resource: `bed_create(room_id)`
  → `room.shelter.organization` → `require_can`; `createShelter(organizationId)` stays
  explicit; no `get_current_organization(info)` as a write input.
- `shelters/services/*` — signatures take the row/parent and derive org internally.
- Header still accepted as a read *default* during the window → FE unaffected.
- Tests: two-persona matrix — scoped operator edits org X (passes), forges org Z
  (404/403), GSO edits any org (passes) — identical mutations, no branches.

## 6. Open decisions

1. Note-create owner-org when the creator spans orgs (or is global) — picker vs
   creator's home org? (decides edit reach + reporting)
2. "Home org" as a remembered client-side preference for creates/filters — UX only,
   never authority.
3. Shelter create requires `organizationId` (no orphan minting) + org-deletion
   semantics — never `SET_NULL`-promote rows to the global tier (ADR §7 item 2).
4. Keep the per-scope / per-row vocabulary small and whitelisted.
5. **Capability wire shape per screen** — self-contained (booleans stamped on each
   row's `org` object, e.g. `shelter.org.canEditShelters`) vs a separate
de-duplicated `orgCapabilities` root. Default v1: self-contained (simpler FE, no
join); the separate root is an optimization for large lists. Per-record rows always
carry per-row flags regardless.

## 7. References

- [ADR 0001] §2.4/§2.6/§5.2/§5.3 — the grant predicate, mutation surface convention,
  FE capability tiers, org-admin milestone.
- [PR #2414] — review thread containing this discussion.
- OpenFGA docs — Check / Batch Check / ListObjects; Zanzibar (Google, USENIX ATC '19);
  GitHub GraphQL `viewerCan*` object fields.

[ADR 0001]: docs/adr/0001-grant-based-authorization.md
[PR #2414]: https://github.com/BetterAngelsLA/monorepo/pull/2414

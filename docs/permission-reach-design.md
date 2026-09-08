# Permission surface — refined contract (proposal for PR #2414)

**Status:** proposal. This is the single artifact for the [PR #2414] permission
surface discussion; it supersedes all earlier comments and intermediate sketches on
that thread. Object-level (per-record) permissions and impersonation are deferred but
reserved for later (see §6).

## 1. Framing: refinements to #2414, not a redesign

The grant-authorization model — roles, grants, the global tier, the predicate
(`can` / `can_obj` / `can_anywhere` / `visible` / `scopes`), the per-org reachability
report, and delegation — is already built and merged or in this stack. After
stress-testing the alternatives (assume-role, record-centric reach, per-row
capability fields, org capability cards), the survivors are things **#2414 already
ships**, plus three surgical deltas:

1. Per-org lists become **effective** (global tier folded in server-side).
2. A finite org list (member ∪ delegated) plus an **"All" mode** for global users —
   no all-orgs enumeration.
3. Org travels as a **query variable / route param** (cache-safe) rather than only the
   `X-Organization-ID` header.

## 2. The model

Two capability sources, one rule:

```graphql
currentUser {
  permissions              # GLOBAL tier — "All" mode, org-less actions, admin-like reach
  organizations {          # switcher = MEMBER ∪ DELEGATED orgs only (finite)
    id name
    permissions            # EFFECTIVE = global ∪ org-scoped(this org, incl. delegated ceiling)
  }
}

# FE: activeSource ∈ { All } ∪ organizations
can(p) = activeSource.permissions.has(p)      # single membership — no client union, no role logic
```

- **All mode** (global users): data = everything the user can reach; capabilities from
  `currentUser.permissions`. Global users do not need an org context by default.
- **Org view** (everyone, incl. a GSO drilling into one org): data scoped to that org
  (`orgId` variable); capabilities from that org's effective entry — which is the
  complete **"what do I fully have access to here"** answer, including global tier +
  member/delegated grants.
- **Non-admin users** are effectively in one org at a time: global list empty, so
  `can(p)` degenerates to the active org's list ("given the org I'm in, can I add a
  shelter?"). Switching orgs updates data + UI from the new entry.

### Actor shapes

| Actor | Switcher | Org view ("here") | All mode |
|---|---|---|---|
| Pure global (GSO, no memberships) | empty — uses All | drilled from All: global set (uniform) | `currentUser.permissions` |
| GSO also member/delegated | member/delegated orgs | global ∪ that org's grants | same |
| Non-admin (member) | their org(s) | scoped perms (global empty) | hidden / = their org |
| Delegated user (A→B) | A and B | B = delegated ceiling (capped) | — |

## 3. Wire contract

```graphql
type CurrentUserType {
  permissions: [String!]!          # global tier — All mode, org-less actions
  organizationsOrganization: [CurrentUserOrganizationType!]   # member ∪ delegated — finite
}
type CurrentUserOrganizationType {
  id: ID
  name: String!
  permissions: [String!]!          # EFFECTIVE: global ∪ org-scoped(this org, incl. delegation)
}
```

Data queries carry the scope as a variable:

```graphql
query Shelters($orgId: ID) {       # org view passes orgId; All mode passes null
  shelters(orgId: $orgId) { id name }
}
```

Writes keep the active org as their target and the backend enforces:

```graphql
createShelter(organizationId: ID!, ...)   # org is an input for row-less creates
updateShelter(id, ...)                    # active-org target; backend can() is the authority
```

## 4. Deltas vs. what #2414 already ships

| # | Change | Where | Size |
|---|---|---|---|
| 1 | Per-org lists **effective** (`global_permissions(user)` folded in per org) | `CurrentUserOrganizationType.permissions` resolver + tests | small |
| 2 | Org list **finite** (member ∪ delegated; no all-orgs expansion for global holders) + FE **All mode** | org-list queryset semantics; FE state (no-active-org = All) | small–medium |
| 3 | Org in **query variables / route params** (part of the cache key) | FE query shapes; backend list resolvers accept `orgId` | medium, mechanical, per domain |

Everything else — the report, delegation with ceiling, `hasPermission`, the switcher,
backend enforcement — already exists. Mutations do not change semantics: org is the
active target, `can()` guards.

## 5. Delegation & invariants

- Delegated orgs appear in the switcher; their effective list = delegated ceiling
  (already correct in `organization_permissions`). Revoking the at-org grant removes
  the org from reach on the next fetch.
- **Invariants**
  1. The mutation is always the authority; lists are rendering aids.
  2. Org is part of the cache identity for reads (variable), never header-only.
  3. No role/relationship leaks to the FE: no `reach`, no `hasGlobalReach`, no raw
     grant data; capabilities only.
  4. No all-orgs enumeration for global holders.
  5. Backend computes org lists from `reachable_orgs` / `organization_permissions`
     (delegation-inclusive); never a membership-only shortcut.

## 6. Deferred (reserved, not blocked)

- **Object-level (per-record) permissions** — per-row `canChange` / `canDelete`
  remains the extension point when per-record authority ships (caseworker note edits,
  shared clients).
- **Impersonation** ("view as another user / their org view") — the org report is
  already principal-parameterized (`organization_permissions(user)`), so this is a
  server-side principal swap later.

## 7. Required steps forward

1. **In #2414 (small):** delta 1 — effective per-org lists (resolver + tests);
   delta 2 — finite org list + FE All mode.
2. **Transport (per domain):** delta 3 — org as query variable / route param for
   reads; retire header as the only org signal. Mechanical; can land domain by domain.
3. **FE apps:** migrate admin + shelter-operator (+ mobile) to All/org modes driven by
   the effective lists; remove the client union.
4. **Later:** object-level surfacing (per-row flags); impersonation; org-deletion
   semantics (never `SET_NULL`-promote data to the global tier).

## 8. Open decisions (non-blocking for v1)

1. GSO nav: All mode default with per-org drill from rows/search (recommended).
2. Note-create owner-org default for multi-org/global editors (pattern is fixed —
   `organizationId` input).
3. Org-deletion semantics (block / reassign / archive).

## 9. References

- [ADR 0001] §2.4/§2.6/§5.2/§5.3 — grant predicate, mutation convention, FE tiers.
- [PR #2414] — this thread (history in earlier comments; this doc is the result).

[ADR 0001]: docs/adr/0001-grant-based-authorization.md
[PR #2414]: https://github.com/BetterAngelsLA/monorepo/pull/2414

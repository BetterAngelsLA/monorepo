/**
 * Apollo Cache Policy Registry (declarative, type-safe)
 *
 * This file defines `policyConfig` as a small, declarative list of entries
 * built with `buildEntry<Q, V>()`, then turns it into the final
 * `cachePolicyRegistry` via `buildPolicies(...)`.
 *
 * WHY THIS PATTERN
 * ─────────────────
 * • Fewer bugs: Compile-time checks ensure each entry is valid:
 *   - `key` must be a list-like field on the query result type `Q`
 *     (i.e., the field has a `.results: []` array). Non-list fields like
 *     `__typename` are rejected.
 *   - `entityTypename` must match the literal `__typename` of the items inside
 *     that list (prevents silent mismatches).
 *   - `keyArgs` must be valid variable names from `V` and automatically
 *     exclude `"pagination"` (we merge pages client-side).
 *
 * • DRY, readable: Each entry is a single ~5-line object; no repeated generics
 *   or string literals scattered around the codebase.
 *
 * • Safe build: `buildPolicies()` assembles an object keyed by each entry’s
 *   `key`, preserving exact types; in dev it warns about duplicate keys.
 *
 * HOW IT WORKS
 * ─────────────
 * 1) `buildEntry<Q, V>({...})` validates and captures:
 *    - `key`: the Query root field (e.g., "tasks")
 *    - `entityTypename`: the list item typename (e.g., "TaskType")
 *    - `keyArgs`: variables to include in Apollo `keyArgs` (e.g., ["filters","ordering"])
 *      Note: "pagination" is intentionally excluded to enable merge-on-scroll.
 *
 * 2) `buildPolicies(policyConfig)` maps the array into a
 *    `TCachePolicyConfig` object suitable for `generateCachePolicies(...)`.
 *
 * 3) Elsewhere, pass `cachePolicyRegistry` to your `generateCachePolicies`
 *    to produce the Apollo `TypePolicies`:
 *
 *    const typePolicies = generateCachePolicies(cachePolicyRegistry, {
 *      defaultKeyFields: ['id'],   // optional: override default keying
 *      strictConflicts: true,      // optional: fail on duplicate keyFields
 *    });
 *
 * USAGE
 * ──────
 * • Add a new list query:
 *   buildEntry<SomeQuery, SomeQueryVariables>({
 *     key: 'someField',                 // must exist on SomeQuery and have .results:[]
 *     entityTypename: 'SomeItemType',   // must match items’ __typename
 *     keyArgs: ['filters', 'order'] as const, // subset of SomeQueryVariables keys
 *   })
 *
 * • Keep `policyConfig` as a readonly tuple (`as const`) so keys stay literal.
 *
 * PITFALLS / GOTCHAS
 * ───────────────────
 * • Duplicate keys: If you list the same `key` twice in `policyConfig`,
 *   `buildPolicies` will warn in dev and the last one wins. Remove duplicates.
 * • Wrong arg name: If the server uses `ordering` (not `order`), your entry
 *   must use `['filters','ordering']` or it won’t be part of the cache key.
 * • Don’t include "pagination" in `keyArgs`—page merging relies on excluding it.
 * • If a result type shouldn’t be normalized as an entity (no stable id),
 *   set `keyFields: false` for that typename in your `generateCachePolicies` step.
 */

import {
  TCachePolicyConfig,
  buildPolicyConfig,
  queryPolicyConfig,
} from '@monorepo/apollo';
import {
  FilterClientProfilesQuery,
  FilterClientProfilesQueryVariables,
} from '../../ui-components/Filters/FilterClients/__generated__/filterClientProfiles.generated';
import {
  FilterOrganizationsQuery,
  FilterOrganizationsQueryVariables,
} from '../../ui-components/Filters/FilterOrganizations/__generated__/filterOrganizations.generated';
import {
  FilterUsersQuery,
  FilterUsersQueryVariables,
} from '../../ui-components/Filters/FilterUsers/__generated__/filterUsers.generated';
import {
  TasksQuery,
  TasksQueryVariables,
} from '../../ui-components/TaskList/__generated__/Tasks.generated';

const policyConfig = [
  queryPolicyConfig<TasksQuery, TasksQueryVariables>({
    key: 'tasks',
    entityTypename: 'TaskType',
    keyArgs: ['filters', 'ordering'] as const,
  }),
  queryPolicyConfig<
    FilterClientProfilesQuery,
    FilterClientProfilesQueryVariables
  >({
    key: 'clientProfiles',
    entityTypename: 'ClientProfileType',
    keyArgs: ['filters', 'order'] as const,
  }),
  queryPolicyConfig<FilterUsersQuery, FilterUsersQueryVariables>({
    key: 'interactionAuthors',
    entityTypename: 'InteractionAuthorType',
    keyArgs: ['filters', 'order'] as const,
  }),
  queryPolicyConfig<
    FilterOrganizationsQuery,
    FilterOrganizationsQueryVariables
  >({
    key: 'caseworkerOrganizations',
    entityTypename: 'OrganizationType',
    keyArgs: ['filters', 'order'] as const,
  }),
] as const;

export const cachePolicyRegistry = buildPolicyConfig(
  policyConfig
) satisfies TCachePolicyConfig;

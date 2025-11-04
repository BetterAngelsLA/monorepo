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
  generateQueryPolicyConf,
} from '@monorepo/apollo';
import {
  HmisListClientsQuery,
  HmisListClientsQueryVariables,
} from '../../ui-components/ClientProfileList/__generated__/HmisListClients.generated';
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

// const { data, loading } = useHmisListClientsQuery({
//   variables: { filter, pagination: { page, perPage: paginationLimit } },
//   fetchPolicy: 'cache-and-network',
//   nextFetchPolicy: 'cache-first',
// });

// queryPolicyRecord<HmisListClientsQuery, HmisListClientsQueryVariables>({
//   key: 'hmisListClients',
//   entityTypename: 'HmisClientType',
//   keyArgs: ['filter', ['pagination', 'perPage']] as const, // include perPage
// }),

const policyConfig = [
  // queryPolicyRecord<
  //   HmisListClientsQuery,
  //   HmisListClientsQueryVariables,
  //   'items'
  // >({
  //   key: 'hmisListClients',
  //   resultsKey: 'items',
  //   entityTypename: 'HmisClientType',
  //   keyArgs: ['filter', ['pagination', 'perPage']] as const,
  //   keyFields: ['personalId'], // query does not use ID but personalId
  //   mergeOpts: {
  //     itemsFieldName: 'items',
  //     totalCountFieldName: 'total',

  //     // adapter: read { page, perPage } → { offset, limit }
  //     resolvePagination: resolvePerPagePagination(),

  //     // normalize: lift meta.totalCount to top-level total (keep meta intact)
  //     transformIncoming(incomingValue) {
  //       if (!incomingValue || typeof incomingValue !== 'object') {
  //         return incomingValue;
  //       }

  //       const objectValue = incomingValue as any;
  //       const totalCount = objectValue?.meta?.totalCount;

  //       if (typeof totalCount !== 'number') {
  //         return incomingValue;
  //       }

  //       return { ...objectValue, total: totalCount };
  //     },
  //     getId(item, readField) {
  //       return (
  //         (readField('uniqueIdentifier', item as any) as
  //           | string
  //           | null
  //           | undefined) ??
  //         (readField('personalId', item as any) as string | null | undefined) ??
  //         null
  //       );
  //     },
  //   },
  // }),

  // totalCount
  // pageInfo {
  //   limit
  //   offset
  // }

  // meta {
  //   currentPage
  //   pageCount
  //   perPage
  //   totalCount
  // }

  // export type HmisPaginationInput = {
  //   page?: InputMaybe<Scalars['Int']['input']>;
  //   perPage?: InputMaybe<Scalars['Int']['input']>;
  // };

  generateQueryPolicyConf<HmisListClientsQuery, HmisListClientsQueryVariables>({
    key: 'hmisListClients',
    entityTypename: 'HmisClientType',
    // including perPage so different page sizes are cached separately
    cacheKeyVariables: ['filter', ['pagination', 'perPage']] as const,
    itemIdPath: 'personalId',
    itemsPath: 'items',
    totalCountPath: ['meta', 'totalCount'],
    paginationVariables: {
      mode: 'perPage',
      pagePath: ['pagination', 'page'], // variables.pagination.page //
      perPagePath: ['pagination', 'perPage'], // variables.pagination.perPage
    },
  }),

  // Existing: ok
  generateQueryPolicyConf<
    FilterClientProfilesQuery,
    FilterClientProfilesQueryVariables
  >({
    key: 'clientProfiles',
    entityTypename: 'ClientProfileType',
    cacheKeyVariables: ['filters', 'order'] as const,
  }),
  generateQueryPolicyConf<FilterUsersQuery, FilterUsersQueryVariables>({
    key: 'interactionAuthors',
    entityTypename: 'InteractionAuthorType',
    cacheKeyVariables: ['filters', 'order'] as const,
  }),
  generateQueryPolicyConf<
    FilterOrganizationsQuery,
    FilterOrganizationsQueryVariables
  >({
    key: 'caseworkerOrganizations',
    entityTypename: 'OrganizationType',
    cacheKeyVariables: ['filters', 'order'] as const,
  }),
] as const;

export const cachePolicyRegistry = buildPolicyConfig(
  policyConfig
) satisfies TCachePolicyConfig;

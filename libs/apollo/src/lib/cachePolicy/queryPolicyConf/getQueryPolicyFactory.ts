/**
 * getQueryPolicyFactory
 *
 * Factory for producing a **per-query policy definition** for list-style
 * GraphQL fields, to be fed into your Apollo cache policy registry.
 *
 * This does three things in one place:
 *  1. normalizes the query-level “where do things live?” info
 *     (itemsPath, totalCountPath, pagination mode + paths)
 *  2. builds an Apollo FieldPolicy with the right keyArgs and merge function
 *  3. returns a { key, buildFn } pair so you can batch-register many fields
 *
 * Internally it:
 *  - runs `generateQueryPolicyConfig(...)` to produce a *strict* QueryPolicyConfig
 *    (fills in default paths, normalizes strings to arrays, respects paginationMode
 *    and paginationVariables)
 *  - runs `getMergeOptions(...)` to prepare merge-time paths (items, totalCount, id)
 *  - runs `generateFieldPolicy(...)` to create the actual Apollo field policy,
 *    passing the normalized QueryPolicyConfig down to the merge layer
 *  - derives `keyFields` from `itemIdPath` when `entityIdFields` isn’t provided
 *
 * The returned object does NOT register itself — you call `.buildFn()` later
 * (typically inside something like `assemblePolicyRegistry([...factories])`)
 * to get the final shape Apollo’s InMemoryCache expects.
 *
 * -------------------------------------------------------------
 * Example: Minimal - use all defaults
 * -------------------------------------------------------------
 * const clientsPolicy = getQueryPolicyFactory<
 *   FilterClientProfilesQuery,
 *   FilterClientProfilesQueryVariables
 * >({
 *   key: 'clientProfiles',
 *   entityTypename: 'ClientProfileType',
 *   cacheKeyVariables: ['filters', 'order'] as const,
 * });
 *
 * -------------------------------------------------------------
 * Example: Custom paths + per-page pagination
 * -------------------------------------------------------------
 * const hmisListClientsPolicy = getQueryPolicyFactory<
 *   HmisListClientsQuery,
 *   HmisListClientsQueryVariables
 * >({
 *   key: 'hmisListClients',
 *   entityTypename: 'HmisClientType',
 *   cacheKeyVariables: ['filter', ['pagination', 'perPage']] as const,
 *   itemsPath: 'items',
 *   totalCountPath: ['meta', 'totalCount'],
 *   itemIdPath: 'personalId',
 *   paginationMode: PaginationModeEnum.PerPage,
 *   // optional: paginationVariables can further override paths
 * });
 *
 * -------------------------------------------------------------
 * Returns
 * -------------------------------------------------------------
 * {
 *   key: 'hmisListClients',
 *   buildFn: () => ({
 *     entityTypename: 'HmisClientType',
 *     keyFields: ['personalId'],
 *     fieldPolicy: { ...apolloFieldPolicy },
 *     // <- strict, normalized config the hook / runtime can read later
 *     queryPolicyConfig: {
 *       paginationMode: 'PER_PAGE',
 *       itemsPath: ['items'],
 *       totalCountPath: ['meta', 'totalCount'],
 *       paginationPagePath: ['pagination', 'page'],
 *       paginationPerPagePath: ['pagination', 'perPage'],
 *     },
 *   }),
 * }
 *
 * Notes
 * -----
 * - `paginationMode` is the high-level hint; `paginationVariables` can override
 *   the exact variable paths.
 * - Array merge mode is still allowed but will log a warning, since it’s not
 *   fully supported.
 * - The normalized `queryPolicyConfig` is intentionally strict; the merge layer
 *   can still use more forgiving pagination resolvers at runtime.
 */

import type { FieldPolicy, TypePolicy } from '@apollo/client';
import {
  DEFAULT_QUERY_ID_KEY,
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
  MergeModeEnum,
  PaginationModeEnum,
} from '../constants';
import { generateFieldPolicy } from '../generateFieldPolicy';
import type { TCacheMergeOpts } from '../merge';
import type {
  KeyArgsFor,
  ResultItemOf,
  TPaginationVariables,
  TypenameOf,
} from '../types';
import { generateQueryPolicyConfig } from './utils/generateQueryPolicyConfig';
import { getMergeOptions } from './utils/getMergeOptions';
import { itemIdPathToKeyFields } from './utils/itemIdPathToKeyFields';

type TgetQueryPolicyFactory<
  TQuery,
  TVariables,
  TFieldKey extends keyof TQuery & string,
  TItem = ResultItemOf<TQuery, TFieldKey>
> = {
  /** query field on Query */
  key: TFieldKey;

  /**
   * Item typename for the list.
   * If can't infer the item type (e.g. the field returns a union),
   * this falls back to just `string` and is not validated.
   */
  entityTypename: [TItem] extends [never] ? string : TypenameOf<TItem>;

  /** variables that affect cache key */
  cacheKeyVariables: KeyArgsFor<TVariables>;

  /** optional: tell Apollo how to identify the item type itself */
  entityIdFields?: TypePolicy['keyFields'];

  /** optional: pagination mode. Will be overridden by paginationVariables */
  paginationMode?: PaginationModeEnum;

  /** optional: describe how pagination is sent in variables. Will overridde paginationMode */
  paginationVariables?: TPaginationVariables;

  /** optional: read items via path, instead of field name */
  itemsPath?: string | ReadonlyArray<string>;

  /** optional: read total via path, instead of field name */
  totalCountPath?: string | ReadonlyArray<string>;

  /** optional: read item id via path */
  itemIdPath?: string | ReadonlyArray<string>;

  /** extra merge options */
  mergeOpts?: TCacheMergeOpts;
};

export function getQueryPolicyFactory<
  TQuery,
  TVariables,
  TFieldKey extends keyof TQuery & string = keyof TQuery & string,
  TItem = ResultItemOf<TQuery, TFieldKey>
>({
  key,
  entityTypename,
  cacheKeyVariables,
  entityIdFields,
  itemIdPath = [DEFAULT_QUERY_ID_KEY],
  itemsPath = [DEFAULT_QUERY_RESULTS_KEY],
  totalCountPath = [DEFAULT_QUERY_TOTAL_COUNT_KEY],
  paginationMode = PaginationModeEnum.Offset,
  paginationVariables,
  mergeOpts = { mode: MergeModeEnum.Object },
}: TgetQueryPolicyFactory<TQuery, TVariables, TFieldKey, TItem>) {
  const isArrayMergeMode = mergeOpts.mode === MergeModeEnum.Array;

  if (isArrayMergeMode) {
    console.warn(
      '[getQueryPolicyFactory]: array mode is not yet fully supported.'
    );
  }

  const resolvedMergeOptions = getMergeOptions(mergeOpts, {
    itemsPath,
    totalCountPath,
    itemIdPath,
  });

  const queryPolicyConfig = generateQueryPolicyConfig({
    itemsPath,
    totalCountPath,
    paginationMode,
    paginationVariables: paginationVariables,
  });

  const fieldPolicy: FieldPolicy = generateFieldPolicy<TItem, TVariables>({
    keyArgs: cacheKeyVariables,
    mergeOpts: resolvedMergeOptions,
    queryPolicyConfig,
  });

  const keyFields = entityIdFields ?? itemIdPathToKeyFields(itemIdPath);

  return {
    key,
    buildFn: () => ({
      entityTypename,
      fieldPolicy,
      keyFields,
      queryPolicyConfig,
    }),
  } as const;
}

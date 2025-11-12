/**
 * generateFieldPolicy
 *
 * A factory function for constructing an Apollo Client `FieldPolicy` that supports
 * paginated list fields using either **Offset/Limit** or **Page/PerPage** pagination.
 * It ensures that Apollo's cache merges incoming pages correctly based on the
 * provided pagination mode and merge behavior.
 *
 * ---------------------------------------------------------------------------
 * Responsibilities
 * ---------------------------------------------------------------------------
 * • Builds an Apollo `FieldPolicy` with:
 *   - `keyArgs`: defines how the cache uniquely identifies this field.
 *   - `merge`: a custom merge function for combining paginated results.
 * • Derives the pagination variable structure from the given `QueryPolicyConfig`
 *   (Offset vs Page mode).
 * • Delegates actual merging logic to `generateMergeFn`, which applies the rules
 *   from `mergeOpts`.
 *
 * ---------------------------------------------------------------------------
 * Arguments
 * ---------------------------------------------------------------------------
 * @param {Object} opts
 * @param {ReadonlyArray<any> | false} opts.keyArgs
 *   Determines which query arguments are used as part of the cache key.
 *   Use an array (e.g., `['filters']`) to differentiate by arguments,
 *   or `false` to merge all results into a single list regardless of args.
 *
 * @param {TCacheMergeOpts} [opts.mergeOpts]
 *   Optional configuration object controlling how results are merged.
 *   For example:
 *   - `mode`: defines merge strategy (e.g., append, replace, or indexed)
 *   - `getId`: custom function to identify individual items
 *   - `maxItems`: optional limit for retained results
 *   The options are passed directly to `generateMergeFn`.
 *
 * @param {QueryPolicyConfig} opts.queryPolicyConfig
 *   Describes the pagination behavior for this field, including:
 *   - `paginationMode`: either `PaginationModeEnum.Offset` or `PaginationModeEnum.PerPage`
 *   - `itemsPath`: JSON path to the items array within the query result
 *   - `totalCountPath`: JSON path to the total count field
 *   - Pagination variable paths (e.g., `paginationOffsetPath`, `paginationLimitPath`, etc.)
 *
 * ---------------------------------------------------------------------------
 * Returns
 * ---------------------------------------------------------------------------
 * Returns a valid Apollo `FieldPolicy` object suitable for registration
 * in the cache configuration (e.g., under `InMemoryCache.typePolicies`):
 *
 * {
 *   keyArgs: string[] | false,
 *   merge: (existing, incoming, options) => any,
 * }
 *
 * ---------------------------------------------------------------------------
 * Example
 * ---------------------------------------------------------------------------
 * import { generateFieldPolicy } from './generateFieldPolicy';
 * import { PaginationModeEnum } from './constants';
 *
 * const tasksPolicy = generateFieldPolicy({
 *   keyArgs: ['filters'],
 *   mergeOpts: { mode: MergeModeEnum.Object },
 *   queryPolicyConfig: {
 *     paginationMode: PaginationModeEnum.Offset,
 *     itemsPath: ['results'],
 *     totalCountPath: ['totalCount'],
 *     paginationOffsetPath: ['pagination', 'offset'],
 *     paginationLimitPath: ['pagination', 'limit'],
 *   },
 * });
 *
 * new InMemoryCache({
 *   typePolicies: { Query: { fields: { tasks: tasksPolicy } } },
 * });
 *
 * ---------------------------------------------------------------------------
 * Notes
 * ---------------------------------------------------------------------------
 * • The `merge` function produced by `generateMergeFn` handles concatenation,
 *   de-duplication, and item identity tracking.
 * • Both pagination modes (`Offset` and `PerPage`) are supported.
 * • Use `mergeOpts` to fine-tune merging behavior without re-implementing merge logic.
 */

import type { FieldPolicy } from '@apollo/client';
import { PaginationModeEnum } from './constants';
import { generateMergeFn } from './merge';
import type { TCacheMergeOpts } from './merge/types';
import { QueryPolicyConfig, TPaginationVariables } from './types';

export function generateFieldPolicy<TItem = unknown, TVars = unknown>(opts: {
  keyArgs: ReadonlyArray<any> | false;
  mergeOpts?: TCacheMergeOpts;
  queryPolicyConfig: QueryPolicyConfig;
}): FieldPolicy {
  const { keyArgs, mergeOpts, queryPolicyConfig } = opts;

  const paginationVariables = toPaginationVariables(queryPolicyConfig);

  return {
    keyArgs,
    merge: generateMergeFn<TItem, TVars>(mergeOpts, paginationVariables),
  };
}

function toPaginationVariables(
  queryPolicyConfig: QueryPolicyConfig
): TPaginationVariables {
  const { paginationMode } = queryPolicyConfig;

  if (paginationMode === PaginationModeEnum.Offset) {
    const { paginationOffsetPath, paginationLimitPath } = queryPolicyConfig;

    return {
      mode: PaginationModeEnum.Offset,
      offsetPath: paginationOffsetPath,
      limitPath: paginationLimitPath,
    };
  }

  const { paginationPagePath, paginationPerPagePath } = queryPolicyConfig;

  return {
    mode: PaginationModeEnum.PerPage,
    pagePath: paginationPagePath,
    perPagePath: paginationPerPagePath,
  };
}

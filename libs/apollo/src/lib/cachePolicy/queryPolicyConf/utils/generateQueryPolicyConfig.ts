/**
 * generateQueryPolicyConfig
 *
 * Builds a **normalized, strict `QueryPolicyConfig`** object from
 * loose user input. Used internally by `getQueryPolicyFactory` to
 * standardize all query policy definitions before attaching them to
 * Apollo cache field policies.
 *
 * Responsibilities:
 *  - Normalizes path-like fields (`itemsPath`, `totalCountPath`) into arrays
 *  - Fills in default paths when not provided
 *  - Ensures `paginationMode` and its variable paths are consistent
 *  - Validates that `itemsPath` is non-empty
 *
 * It returns the normalized Offset/Limit shape, e.g.:
 *
 *   {
 *     paginationMode: 'OFFSET',
 *     itemsPath: ['results'],
 *     totalCountPath: ['totalCount'],
 *     paginationOffsetPath: ['pagination', 'offset'],
 *     paginationLimitPath: ['pagination', 'limit'],
 *   }
 *
 * This function is **strict by design** — it will throw if an invalid
 * or empty path is provided. Runtime helpers (e.g. pagination resolvers)
 * may later apply more forgiving fallback behavior when consuming this config.
 *
 * @param input - User-provided `QueryPolicyConfigInput`
 * @returns Normalized `QueryPolicyConfig` ready to attach to a field policy
 */

import { toPathArray, toPathArrayStrict } from '../../../utils';
import {
  DEFAULT_OFFSET_PAGINATION_VARS,
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
  PaginationModeEnum,
} from '../../constants';
import {
  QueryPolicyConfig,
  QueryPolicyConfigInput,
} from '../../types/queryPolicyConfig';

export function generateQueryPolicyConfig(
  input: QueryPolicyConfigInput,
): QueryPolicyConfig {
  const {
    itemsPath = [DEFAULT_QUERY_RESULTS_KEY],
    paginationMode = PaginationModeEnum.Offset,
    totalCountPath = [DEFAULT_QUERY_TOTAL_COUNT_KEY],
    paginationVariables,
  } = input;

  const resolvedItemsPath = toPathArray(itemsPath);

  if (!resolvedItemsPath?.length) {
    throw new Error(
      '[buildQueryPolicyConfig] itemsPath must be a non-empty string or string[]',
    );
  }

  const resolvedTotalCountPath = toPathArray(totalCountPath);

  const offsetPath =
    paginationVariables?.offsetPath ??
    DEFAULT_OFFSET_PAGINATION_VARS.offsetPath;
  const limitPath =
    paginationVariables?.limitPath ?? DEFAULT_OFFSET_PAGINATION_VARS.limitPath;

  return {
    paginationMode,
    itemsPath: resolvedItemsPath,
    totalCountPath: resolvedTotalCountPath,
    paginationOffsetPath: toPathArrayStrict(offsetPath),
    paginationLimitPath: toPathArrayStrict(limitPath),
  };
}

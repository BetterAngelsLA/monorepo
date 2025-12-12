/**
 * generateMergeFn
 *
 * Creates an Apollo `FieldMergeFunction` for merging paginated query results
 * inside the Apollo cache. The generated merge function determines how
 * incoming pages are combined with existing cached data.
 *
 * ---------------------------------------------------------------------------
 * Responsibilities
 * ---------------------------------------------------------------------------
 * • Chooses the correct merge strategy (`Array` or `Object`) based on
 *   `mergeOptions.mode`.
 * • Resolves pagination information from query variables using
 *   `generatePaginationResolver`.
 * • Delegates the actual merging behavior to either:
 *   - `mergeArrayPayload` — for array-style pagination merges.
 *   - `mergeObjectPayload` — for object-style pagination merges with nested items.
 *
 * ---------------------------------------------------------------------------
 * Arguments
 * ---------------------------------------------------------------------------
 * @param {TCacheMergeOpts} [mergeOptions]
 *   Optional configuration controlling merge behavior:
 *   - `mode`: either `MergeModeEnum.Array` or `MergeModeEnum.Object`.
 *   - `itemsPath`: JSON path to the array of results within the response.
 *   - `totalCountPath`: JSON path to the total count field.
 *   - `itemIdPath`: optional path to identify unique items.
 *   If omitted, defaults to `{ mode: MergeModeEnum.Object }`.
 *
 * @param {TPaginationVariables} [paginationVariables]
 *   Normalized pagination metadata describing how to extract pagination
 *   variables (offset/limit or page/perPage) from query arguments.
 *   Usually generated via `toPaginationVariables()` in `generateFieldPolicy`.
 *
 * ---------------------------------------------------------------------------
 * Returns
 * ---------------------------------------------------------------------------
 * A valid Apollo `FieldMergeFunction` of the form:
 *
 * (existing, incoming, options) => any
 *
 * which Apollo calls whenever new paginated data arrives for the field.
 * The returned function merges cached and incoming results appropriately.
 *
 * ---------------------------------------------------------------------------
 * Example
 * ---------------------------------------------------------------------------
 * import { generateMergeFn } from './generateMergeFn';
 * import { MergeModeEnum } from '../../constants';
 *
 * const merge = generateMergeFn(
 *   { mode: MergeModeEnum.Array },
 *   {
 *      mode: 'Offset',
 *      offsetPath: ['pagination', 'offset'],
 *      limitPath: ['pagination', 'limit']
 *    }
 * );
 *
 * const fieldPolicy = { keyArgs: false, merge };
 *
 * ---------------------------------------------------------------------------
 * Notes
 * ---------------------------------------------------------------------------
 * • `mergeArrayPayload` is typically used when the top-level field is an array.
 * • `mergeObjectPayload` is used when the field contains an object with
 *   a nested array and metadata like `totalCount`.
 * • This function is usually called from `generateFieldPolicy`.
 */

import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import { MergeModeEnum } from '../../constants';
import type { TPaginationVariables } from '../../types';
import { mergeArrayPayload, mergeObjectPayload } from '../mergeFunctions';
import type { TCacheMergeOpts } from '../types';
import { generatePaginationResolver } from './utils';

export function generateMergeFn<TItem = unknown, TVars = unknown>(
  mergeOptions?: TCacheMergeOpts,
  paginationVariables?: TPaginationVariables
): FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  const resolvedMergeOpts = mergeOptions ?? {
    mode: MergeModeEnum.Object,
  };

  const resolvePaginationFn =
    generatePaginationResolver<TVars>(paginationVariables);

  if (resolvedMergeOpts.mode === MergeModeEnum.Array) {
    return mergeArrayPayload<TItem, TVars>(
      resolvePaginationFn
    ) as FieldMergeFunction<
      unknown,
      unknown,
      FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
    >;
  }

  const { itemIdPath, totalCountPath, itemsPath } = resolvedMergeOpts;

  return mergeObjectPayload<TItem, TVars>({
    resolvePaginationFn,
    itemIdPath,
    itemsPath,
    totalCountPath,
  });
}

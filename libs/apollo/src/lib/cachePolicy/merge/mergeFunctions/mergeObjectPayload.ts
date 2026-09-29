/**
 * mergeObjectPayload
 *
 * Apollo `FieldMergeFunction` implementation for paginated responses
 * where the server returns an **object** containing both:
 *   • an array of items (e.g., `results`, `items`, etc.)
 *   • metadata such as `totalCount` or `meta.totalCount`.
 *
 * This function places each incoming page's items at their target offsets
 * (the robust offset-merge pattern from the Apollo docs):
 *
 *     merged[offset + i] = incoming[i]
 *
 * Note: offset pagination degrades when items move between pages while
 * paginating (an insert/delete shifts the window, so pages can overlap or
 * skip). This merge intentionally does not sift items around to reconcile
 * that: leaving `undefined` holes behind makes Apollo unable to read the
 * field (readQuery returns null → blank list). Use cursor/Relay pagination
 * (`relayStylePagination`) if a list needs move-proof pagination.
 *
 * ---------------------------------------------------------------------------
 * Responsibilities
 * ---------------------------------------------------------------------------
 * • Reads the existing cached data and the newly fetched page.
 * • Computes the correct target index for each incoming item based on the
 *   pagination offset or page number (via `resolvePaginationFn`).
 * • Places each incoming item at `offset + i`, replacing stale entries in place.
 * • Updates the total count (if available) and returns a new merged object,
 *   copying only the containers along the written paths (the possibly frozen
 *   incoming data is never mutated).
 *
 * ---------------------------------------------------------------------------
 * Arguments
 * ---------------------------------------------------------------------------
 * @param {Object} args
 * @param {string | string[]} [args.itemsPath]
 *   Path to the array of items in the server response (e.g., `"items"` or `["data", "results"]`).
 *   Defaults to `["results"]` via `DEFAULT_QUERY_RESULTS_KEY`.
 *
 * @param {string | string[]} [args.totalCountPath]
 *   Path to the total count field (e.g., `["meta", "totalCount"]`).
 *   Defaults to `["totalCount"]` via `DEFAULT_QUERY_TOTAL_COUNT_KEY`.
 *
 * @param {ResolveMergePagination<TVars>} args.resolvePaginationFn
 *   Function that extracts pagination details (e.g., `offset`, `limit`, `page`)
 *   from the query variables. Used to calculate where incoming items should
 *   be inserted in the merged array.
 *
 * ---------------------------------------------------------------------------
 * Returns
 * ---------------------------------------------------------------------------
 * A valid Apollo `FieldMergeFunction`:
 *
 * (existing, incoming, fieldOptions) => merged
 *
 * which Apollo automatically calls when merging cached and incoming
 * results for a given paginated field.
 *
 * The returned merged object:
 * - Contains all fetched items up to the current page/offset.
 * - Has its `itemsPath` updated with the combined list.
 * - Has its `totalCountPath` set from either the new or existing data.
 *
 * ---------------------------------------------------------------------------
 * Merge Algorithm (simplified)
 * ---------------------------------------------------------------------------
 * 1. Read existing and incoming items via `getItemsFromPathFn`.
 * 2. Compute the offset (or start index) using `resolvePaginationFn`.
 * 3. Place each incoming item at `offset + i`.
 * 4. Path-set the merged items into a new object (`withValueAtPath` copies
 *    only the containers along the written path; the incoming object is
 *    never mutated, so frozen cache data is fine).
 * 5. Extract and reapply `totalCount` the same way.
 * 6. Return the fully merged object to Apollo.
 */

import type { FieldMergeFunction } from '@apollo/client';
import type { FieldMergeFunctionOptions } from '@apollo/client/cache';
import { withValueAtPath } from '../../../utils';
import {
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
} from '../../constants';
import { defaultGetItems } from '../../utils';
import type { ResolveMergePagination } from '../types';
import { extractTotalCount, getItemsFromPathFn } from './utils';

type TMergeObjectPayloadArgs<TVars> = {
  /** where the server puts the array, e.g. "items" or ["data", "items"] */
  itemsPath?: string | ReadonlyArray<string>;

  /** where the server puts total, e.g. ["meta", "totalCount"] */
  totalCountPath?: string | ReadonlyArray<string>;

  resolvePaginationFn: ResolveMergePagination<TVars>;
};

export function mergeObjectPayload<TItem = unknown, TVars = unknown>(
  args: TMergeObjectPayloadArgs<TVars>,
): FieldMergeFunction<
  unknown,
  unknown,
  FieldMergeFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  const {
    resolvePaginationFn,
    itemsPath = [DEFAULT_QUERY_RESULTS_KEY],
    totalCountPath = [DEFAULT_QUERY_TOTAL_COUNT_KEY],
  } = args;

  const readItems = getItemsFromPathFn<TItem>(itemsPath) ?? defaultGetItems;

  return function mergeObject(
    existingValue,
    incomingValue,
    fieldOptions,
  ): Record<string, unknown> {
    const { args } = fieldOptions;

    const { offset } = resolvePaginationFn(args as TVars);

    const existingObject = (existingValue as Record<string, unknown>) ?? {};
    const incomingObject = (incomingValue as Record<string, unknown>) ?? {};

    const existingItems = readItems(existingObject) ?? [];
    const newItems = readItems(incomingObject) ?? [];

    const mergedItems = existingItems.slice() as (TItem | undefined)[];

    for (let i = 0; i < newItems.length; i = i + 1) {
      const newItem = newItems[i] as TItem;

      if (newItem === undefined) {
        continue;
      }

      mergedItems[offset + i] = newItem;
    }

    // Path-set instead of clone-and-mutate: `withValueAtPath` copies only the
    // containers along the written path and never mutates the (possibly
    // frozen) incoming object.
    let result = withValueAtPath(incomingObject, itemsPath, mergedItems);

    if (result === incomingObject) {
      console.error(
        '[mergeObjectPayload] failed to write items at path',
        itemsPath,
      );
    }

    const totalCount = extractTotalCount({
      primaryObject: incomingObject,
      fallbackObject: existingObject,
      totalCountPath,
    });

    if (totalCount === undefined) {
      console.warn(
        '[mergeObjectPayload] expected totalCount to be defined for totalCountPath: ',
        totalCountPath,
      );
    }

    if (totalCount !== undefined) {
      const withTotalCount = withValueAtPath(
        result,
        totalCountPath,
        totalCount,
      );

      if (withTotalCount === result) {
        console.error(
          '[mergeObjectPayload] failed to write totalCount at path',
          totalCountPath,
        );
      } else {
        result = withTotalCount;
      }
    }

    return result;
  };
}

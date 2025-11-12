/**
 * mergeObjectPayload
 *
 * Apollo `FieldMergeFunction` implementation for paginated responses
 * where the server returns an **object** containing both:
 *   • an array of items (e.g., `results`, `items`, etc.)
 *   • metadata such as `totalCount` or `meta.totalCount`.
 *
 * This function merges the existing and incoming results
 * into a single normalized list within Apollo’s cache while preserving order.
 *
 * ---------------------------------------------------------------------------
 * Responsibilities
 * ---------------------------------------------------------------------------
 * • Reads the existing cached data and the newly fetched page.
 * • Computes the correct target index for each incoming item based on the
 *   pagination offset or page number (via `resolvePaginationFn`).
 * • Uses each item’s stable ID to avoid duplication and replace outdated entries.
 * • Updates the total count (if available) and writes the merged result back
 *   into a deep-cloned copy of the incoming object.
 *
 * ---------------------------------------------------------------------------
 * Arguments
 * ---------------------------------------------------------------------------
 * @param {Object} args
 * @param {string | string[]} [args.itemIdPath]
 *   Path to the unique identifier within each item (e.g., `"id"` or `"personalId"`).
 *   Defaults to `["id"]` via `DEFAULT_QUERY_ID_KEY`.
 *
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
 * 3. Build a map of existing items by ID for quick lookup.
 * 4. For each incoming item:
 *    • Determine its new target index (`offset + i`).
 *    • If another copy of that item exists elsewhere, remove it.
 *    • Insert the new item at the correct position.
 * 5. Deep-clone the incoming object (Apollo may freeze objects in cache).
 * 6. Write the merged items back to `itemsPath`.
 * 7. Extract and reapply `totalCount` to the merged result.
 * 8. Return the fully merged object to Apollo.
 */

import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import { deepCloneWeak, writeAtPath } from '../../../utils';
import {
  DEFAULT_QUERY_ID_KEY,
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
} from '../../constants';
import { defaultGetItemId, defaultGetItems } from '../../utils';
import type { ResolveMergePagination } from '../types';
import {
  buildPositionByIdMap,
  extractTotalCount,
  getItemIdFromPathFn,
  getItemsFromPathFn,
} from './utils';

type TMergeObjectPayloadArgs<TVars> = {
  /** where the item has its id, e.g. "personalId" */
  itemIdPath?: string | ReadonlyArray<string>;

  /** where the server puts the array, e.g. "items" or ["data", "items"] */
  itemsPath?: string | ReadonlyArray<string>;

  /** where the server puts total, e.g. ["meta", "totalCount"] */
  totalCountPath?: string | ReadonlyArray<string>;

  resolvePaginationFn: ResolveMergePagination<TVars>;
};

export function mergeObjectPayload<TItem = unknown, TVars = unknown>(
  args: TMergeObjectPayloadArgs<TVars>
): FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  const {
    resolvePaginationFn,
    itemIdPath = [DEFAULT_QUERY_ID_KEY],
    itemsPath = [DEFAULT_QUERY_RESULTS_KEY],
    totalCountPath = [DEFAULT_QUERY_TOTAL_COUNT_KEY],
  } = args;

  const readItems = getItemsFromPathFn<TItem>(itemsPath) ?? defaultGetItems;
  const readItemId = getItemIdFromPathFn<TItem>(itemIdPath) ?? defaultGetItemId;

  return function mergeObject(
    existingValue,
    incomingValue,
    fieldOptions
  ): Record<string, unknown> {
    const { readField, args } = fieldOptions;

    const { offset } = resolvePaginationFn(args as TVars);

    const existingObject = (existingValue as Record<string, unknown>) ?? {};
    const incomingObject = (incomingValue as Record<string, unknown>) ?? {};

    const existingItems = readItems(existingObject) ?? [];
    const newItems = readItems(incomingObject) ?? [];

    const mergedItems = existingItems.slice() as (TItem | undefined)[];

    const positionById = buildPositionByIdMap(
      mergedItems,
      readItemId,
      readField
    );

    for (let i = 0; i < newItems.length; i = i + 1) {
      const newItem = newItems[i] as TItem;
      if (newItem === undefined) {
        continue;
      }

      const targetIndex = offset + i;
      const id = readItemId(newItem, readField);

      if (id !== null && id !== undefined) {
        const existingAt = positionById.get(id);

        if (existingAt !== undefined && existingAt !== targetIndex) {
          mergedItems[existingAt] = undefined;
        }

        positionById.set(id, targetIndex);
      }

      mergedItems[targetIndex] = newItem;
    }

    // make a deep, writable copy as incomingObject can be Frozen by Apollo
    const result = deepCloneWeak(incomingObject);

    // write merged items back where they came from
    const writeItemsResult = writeAtPath(result, itemsPath, mergedItems);

    if (!writeItemsResult) {
      console.error(
        '[mergeObjectPayload] failed to write items at path',
        itemsPath,
        writeItemsResult
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
        totalCountPath
      );
    }

    if (totalCount !== undefined) {
      const writeTotalResult = writeAtPath(result, totalCountPath, totalCount);

      if (!writeTotalResult) {
        console.error(
          '[mergeObjectPayload] failed to write totalCount at path',
          totalCountPath,
          writeTotalResult
        );
      }
    }

    return result;
  };
}

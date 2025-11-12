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

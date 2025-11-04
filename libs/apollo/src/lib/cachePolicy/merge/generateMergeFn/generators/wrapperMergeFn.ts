import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import { mergeObjectPayload } from '../../mergeFunctions';
import type {
  ResolveMergePagination,
  TCacheMergeOpts,
  WrapperMode,
} from '../../types';
import { getItemIdFromPathFn } from './getItemIdFromPathFn';
import { getItemsFromPathFn } from './getItemsFromPathFn';
import { getTotalCountFromPathFn } from './getTotalCountFromPathFn';

export function wrapperMergeFn<TItem, TVars>(
  wrapperOptions: WrapperMode<TVars>,
  resolvePaginationFn: ResolveMergePagination<TVars>,
  mergeOpts?: TCacheMergeOpts<TVars>
): FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  const itemsAccessor =
    (mergeOpts as any)?.getItems ??
    getItemsFromPathFn<TItem>(wrapperOptions.itemsPath);

  const totalCountAccessor =
    (mergeOpts as any)?.getTotalCount ??
    getTotalCountFromPathFn(wrapperOptions.totalCountPath);

  const itemIdAccessor =
    (mergeOpts as any)?.getItemId ??
    getItemIdFromPathFn<TItem>(wrapperOptions.itemIdPath);

  const baseWrapperMerge = mergeObjectPayload<TItem, TVars>(
    {
      // we standardize how we store it in cache
      resultsKey: 'results',
      totalKey: 'totalCount',
      pageInfoKey: 'pageInfo',
    },
    resolvePaginationFn,
    {
      getItems: itemsAccessor,
      getTotalCount: totalCountAccessor,
      getItemId: itemIdAccessor,
    }
  ) as FieldMergeFunction<
    unknown,
    unknown,
    FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
  >;

  return function mergeObjectWithOptionalTransform(
    existingValue,
    incomingValue,
    fieldOptions
  ) {
    const transformer = (mergeOpts as any)?.transformIncoming;

    let normalizedIncoming = incomingValue;
    if (typeof transformer === 'function') {
      normalizedIncoming = transformer(incomingValue);
    }

    return baseWrapperMerge(existingValue, normalizedIncoming, fieldOptions);
  };
}

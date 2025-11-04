import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import { mergeArrayPayload } from '../../mergeFunctions';
import type { ResolveMergePagination, TCacheMergeOpts } from '../../types';

export function arrayMergeFn<TItem, TVars>(
  resolvePaginationFn: ResolveMergePagination<TVars>,
  mergeOpts?: TCacheMergeOpts<TItem, TVars>
): FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  const baseArrayMerge = mergeArrayPayload<TItem, TVars>(
    resolvePaginationFn
  ) as FieldMergeFunction<
    unknown,
    unknown,
    FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
  >;

  return function mergeArrayWithOptionalTransform(
    existingValue,
    incomingValue,
    fieldOptions
  ) {
    const transformer = (mergeOpts as any)?.transformIncoming;

    let normalizedIncoming = incomingValue;
    if (typeof transformer === 'function') {
      normalizedIncoming = transformer(incomingValue);
    }

    return baseArrayMerge(existingValue, normalizedIncoming, fieldOptions);
  };
}

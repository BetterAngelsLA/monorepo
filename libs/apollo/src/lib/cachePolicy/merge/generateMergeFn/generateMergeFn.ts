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

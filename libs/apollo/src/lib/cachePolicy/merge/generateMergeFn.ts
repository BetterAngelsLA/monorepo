import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import { mergeArrayPayload } from './mergeFunctions/mergeArrayPayload';
import { mergeObjectPayload } from './mergeFunctions/mergeObjectPayload';
import type {
  AdaptArgs,
  PageVars,
  TCacheMergeOpts,
  WrapperMode,
} from './types';

function defaultAdapt<TVars = unknown>(vars: TVars | undefined): PageVars {
  return (
    (vars as unknown as { pagination?: PageVars } | undefined)?.pagination ?? {}
  );
}

type TResult = FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
>;

export function generateMergeFn<TItem = unknown, TVars = unknown>(
  opts?: TCacheMergeOpts<TItem, TVars>
): TResult {
  const adapt = (opts?.adaptArgs ?? defaultAdapt) as AdaptArgs<TVars>;

  if (opts?.mode === 'array') {
    return mergeArrayPayload<TItem, TVars>(adapt) as unknown as TResult; // <-- pass TVars
  }

  const {
    resultsKey = 'results',
    totalKey = 'totalCount',
    pageInfoKey = 'pageInfo',
    mergeItemOpts,
  } = (opts ?? {}) as WrapperMode<TItem, TVars>;

  return mergeObjectPayload<TItem, TVars>(
    { resultsKey, totalKey, pageInfoKey },
    adapt,
    mergeItemOpts
  ) as unknown as TResult;
}

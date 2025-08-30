import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import { AdaptArgs, PageVars, TCacheMergeOpts, WrapperMode } from './types';
import { arrayMerge } from './utils/arrayMerge';
import { wrapperMerge } from './utils/wrapperMerge';

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
  opts?: TCacheMergeOpts<TVars>
): TResult {
  const mode = (opts?.mode ?? 'wrapper') as 'array' | 'wrapper';
  const adapt = (opts?.adaptArgs ?? defaultAdapt) as AdaptArgs<unknown>;

  if (mode === 'array') {
    return arrayMerge<TItem>(adapt);
  }

  // Merge for wrapper: { results, totalCount, pageInfo }
  const resultsKey = (opts as WrapperMode<TVars>)?.resultsKey ?? 'results';
  const totalKey = (opts as WrapperMode<TVars>)?.totalKey ?? 'totalCount';
  const pageInfoKey = (opts as WrapperMode<TVars>)?.pageInfoKey ?? 'pageInfo';

  return wrapperMerge<TItem>({ resultsKey, totalKey, pageInfoKey }, adapt);
}

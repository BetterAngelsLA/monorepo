import type { FieldFunctionOptions, FieldMergeFunction } from '@apollo/client';
import { TPaginationVariables } from '../../types';
import {
  createOffsetPaginationResolver,
  createPerPagePaginationResolver,
} from '../resolvers';
import type {
  ResolveMergePagination,
  TCacheMergeOpts,
  WrapperMode,
} from '../types';
import {
  arrayMergeFn,
  defaultPaginationResolverFn,
  wrapperMergeFn,
} from './generators';

export function generateMergeFn<TItem = unknown, TVars = unknown>(
  mergeOpts?: TCacheMergeOpts<TVars>,
  paginationVariables?: TPaginationVariables
): FieldMergeFunction<
  unknown,
  unknown,
  FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>
> {
  const effectiveMergeOpts = (mergeOpts ?? {}) as
    | WrapperMode<TVars>
    | { mode: 'array' };

  const resolvePaginationFn = getPaginationResolver<TVars>(
    effectiveMergeOpts,
    paginationVariables
  );

  if ((effectiveMergeOpts as any).mode === 'array') {
    return arrayMergeFn<TItem, TVars>(resolvePaginationFn, mergeOpts);
  }

  return wrapperMergeFn<TItem, TVars>(
    effectiveMergeOpts as WrapperMode<TVars>,
    resolvePaginationFn,
    mergeOpts
  );
}

function getPaginationResolver<TVars>(
  mergeOpts: WrapperMode<TVars> | { mode: 'array' },
  paginationVariables?: TPaginationVariables
): ResolveMergePagination<TVars> {
  const hasUserResolver =
    'resolvePaginationFn' in mergeOpts &&
    typeof mergeOpts.resolvePaginationFn === 'function';

  if (hasUserResolver) {
    return mergeOpts.resolvePaginationFn as ResolveMergePagination<TVars>;
  }

  if (paginationVariables) {
    if (paginationVariables.mode === 'perPage') {
      return createPerPagePaginationResolver<TVars>(paginationVariables);
    }

    return createOffsetPaginationResolver<TVars>(paginationVariables);
  }

  return defaultPaginationResolverFn as ResolveMergePagination<TVars>;
}

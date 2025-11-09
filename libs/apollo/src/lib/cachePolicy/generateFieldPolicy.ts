import type { FieldPolicy } from '@apollo/client';
import { PaginationModeEnum } from './constants';
import { generateMergeFn } from './merge';
import type { TCacheMergeOpts } from './merge/types';
import { QueryPolicyConfig, TPaginationVariables } from './types';

export function generateFieldPolicy<TItem = unknown, TVars = unknown>(opts: {
  keyArgs: ReadonlyArray<any> | false;
  mergeOpts?: TCacheMergeOpts;
  queryPolicyConfig: QueryPolicyConfig;
}): FieldPolicy {
  const { keyArgs, mergeOpts, queryPolicyConfig } = opts;

  const paginationVariables = toPaginationVariables(queryPolicyConfig);

  return {
    keyArgs,
    merge: generateMergeFn<TItem, TVars>(mergeOpts, paginationVariables),
  };
}

function toPaginationVariables(
  queryPolicyConfig: QueryPolicyConfig
): TPaginationVariables {
  const { paginationMode } = queryPolicyConfig;

  if (paginationMode === PaginationModeEnum.Offset) {
    const { paginationOffsetPath, paginationLimitPath } = queryPolicyConfig;

    return {
      mode: PaginationModeEnum.Offset,
      offsetPath: paginationOffsetPath,
      limitPath: paginationLimitPath,
    };
  }

  const { paginationPagePath, paginationPerPagePath } = queryPolicyConfig;

  return {
    mode: PaginationModeEnum.PerPage,
    pagePath: paginationPagePath,
    perPagePath: paginationPerPagePath,
  };
}

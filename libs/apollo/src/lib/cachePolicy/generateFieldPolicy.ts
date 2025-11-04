import type { FieldPolicy } from '@apollo/client';
import { generateMergeFn } from './merge';
import type { TCacheMergeOpts } from './merge/types';
import { TPaginationVariables } from './types';

export function generateFieldPolicy<TItem = unknown, TVars = unknown>(opts: {
  keyArgs: ReadonlyArray<any> | false;
  mergeOpts?: TCacheMergeOpts<TVars>;
  paginationVariables?: TPaginationVariables;
}): FieldPolicy<Record<string, unknown>, Record<string, unknown>> {
  const { keyArgs, mergeOpts, paginationVariables } = opts;

  return {
    keyArgs,
    merge: generateMergeFn<TItem, TVars>(
      mergeOpts,
      paginationVariables
    ) as FieldPolicy<Record<string, unknown>, Record<string, unknown>>['merge'],
  };
}

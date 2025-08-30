import type { FieldPolicy } from '@apollo/client';
import { TCacheMergeOpts, generateMergeFn } from '../cachePolicies';

type TPolicyOpts<TVars> = {
  /** Include only filters/sort etc. Never include pagination here. */
  keyArgs: ReadonlyArray<string> | false;
  /** Options for the merge behavior (wrapper vs array, keys, adaptArgs…) */
  mergeOpts?: TCacheMergeOpts<TVars>;
};

export function generateQueryFieldPolicy<TItem, TVars>(
  opts: TPolicyOpts<TVars>
): FieldPolicy<Record<string, unknown>, Record<string, unknown>> {
  const { keyArgs, mergeOpts } = opts;

  return {
    keyArgs,
    merge: generateMergeFn<TItem, TVars>(mergeOpts) as FieldPolicy['merge'],
  };
}

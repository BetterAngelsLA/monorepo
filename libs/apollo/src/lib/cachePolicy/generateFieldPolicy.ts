import type { FieldPolicy } from '@apollo/client';
import { TCacheMergeOpts, generateMergeFn } from './merge';

type TPolicyOpts<TItem, TVars> = {
  keyArgs: ReadonlyArray<string> | false;
  mergeOpts?: TCacheMergeOpts<TItem, TVars>;
};

export function generateFieldPolicy<
  TItem = unknown,
  TVars = { pagination?: { offset?: number; limit?: number } }
>(
  opts: TPolicyOpts<TItem, TVars>
): FieldPolicy<Record<string, unknown>, Record<string, unknown>> {
  const { keyArgs, mergeOpts } = opts;

  return {
    keyArgs,
    merge: generateMergeFn<TItem, TVars>(mergeOpts) as FieldPolicy<
      Record<string, unknown>,
      Record<string, unknown>
    >['merge'],
  };
}

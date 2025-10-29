/**
 * generateFieldPolicy
 *
 * Small helper to generate an Apollo `FieldPolicy` for list-like query fields,
 * with strong typing for the items and variables.
 *
 * It wraps Apollo's `merge` logic with a reusable `generateMergeFn` so that
 * infinite scrolling / pagination works out of the box.
 *
 * --------------------------------------------------------------------
 * Usage
 * --------------------------------------------------------------------
 *
 * // 1. Define a field policy for a Query field with offset/limit pagination:
 *
 * const clientProfilesPolicy = generateFieldPolicy<UserRow>({
 *   keyArgs: ['filters', 'order'], // arguments that uniquely identify the field
 *   mergeOpts: {
 *     // merge behavior comes from generateMergeFn
 *     readExisting: (existing) => existing?.results ?? [],
 *     mergeResults: (existing, incoming, { offset }) => {
 *       const merged = existing ? existing.slice(0) : [];
 *       for (let i = 0; i < incoming.length; i++) {
 *         merged[offset + i] = incoming[i];
 *       }
 *       return merged;
 *     },
 *   },
 * });
 *
 * // 2. Attach it in your Apollo cache type policies:
 *
 * new InMemoryCache({
 *   typePolicies: {
 *     Query: {
 *       fields: {
 *         clientProfiles: clientProfilesPolicy,
 *       },
 *     },
 *   },
 * });
 *
 * --------------------------------------------------------------------
 * Arguments
 * --------------------------------------------------------------------
 *
 * @param opts.keyArgs
 *   Which query arguments uniquely identify this field:
 *   - Array of strings → stable key (e.g. ['filters', 'order'])
 *   - false → don’t use arguments for field identity
 *
 * @param opts.mergeOpts
 *   Options passed to `generateMergeFn` that control how existing and incoming
 *   results are combined. Used to implement infinite scrolling / pagination.
 *
 * --------------------------------------------------------------------
 * Returns
 * --------------------------------------------------------------------
 *
 * An Apollo `FieldPolicy` object:
 * {
 *   keyArgs: string[] | false;
 *   merge: (existing, incoming, options) => any;
 * }
 *
 * You can pass this directly into `InMemoryCache.typePolicies.Query.fields`.
 */

import type { FieldPolicy } from '@apollo/client';
import { TCacheMergeOpts, generateMergeFn } from './merge';

export function generateFieldPolicy<TItem = unknown, TVars = unknown>(opts: {
  keyArgs: ReadonlyArray<string> | false;
  mergeOpts?: TCacheMergeOpts<TItem, TVars>;
  // mergeOpts?: {
  //   itemsFieldName?: string; // defaults to 'results'
  //   totalFieldName?: string; // defaults to 'totalCount'
  //   resolvePagination?: (
  //     vars: TVars | undefined
  //   ) => { offset: number; limit: number } | undefined;
  //   transformIncoming?: (incoming: any) => any; // ← NEW
  //   getId?: (
  //     item: TItem,
  //     readField: FieldFunctionOptions['readField']
  //   ) => string | number | null | undefined;
  // };
}): FieldPolicy<Record<string, unknown>, Record<string, unknown>> {
  const { keyArgs, mergeOpts } = opts;
  return {
    keyArgs,
    merge: generateMergeFn<TItem, TVars>(mergeOpts) as FieldPolicy<
      Record<string, unknown>,
      Record<string, unknown>
    >['merge'],
  };
}

import type { FieldPolicy, TypePolicy } from '@apollo/client';
import {
  DEFAULT_OFFSET_PAGINATION,
  DEFAULT_QUERY_ID_KEY,
  DEFAULT_QUERY_RESULTS_KEY,
  DEFAULT_QUERY_TOTAL_COUNT_KEY,
} from '../constants';
import { generateFieldPolicy } from '../generateFieldPolicy';
import type { TCacheMergeOpts } from '../merge';
import type {
  KeyArgSpec,
  ResultItemOf,
  TPaginationVariables,
  TypenameOf,
} from '../types';
import { itemIdPathToKeyFields } from './utils/itemIdPathToKeyFields';

type TGenerateQueryPolicyConf<
  TQuery,
  TVariables,
  // TFieldKey extends keyof TQuery & string = keyof TQuery & string,
  TFieldKey extends keyof TQuery & string,
  TItem = ResultItemOf<TQuery, TFieldKey>
> = {
  /** query field on Query */
  key: TFieldKey;

  /**
   * Item typename for the list.
   * If can't infer the item type (e.g. the field returns a union),
   * this falls back to just `string` and is not validated.
   */
  entityTypename: [TItem] extends [never] ? string : TypenameOf<TItem>;

  /** variables that affect cache key */
  cacheKeyVariables: readonly KeyArgSpec<TVariables>[];

  /** optional: tell Apollo how to identify the item type itself */
  entityIdFields?: TypePolicy['keyFields'];

  /** optional: describe how pagination is sent in variables */
  paginationVariables?: TPaginationVariables;

  /** optional: read items via path, instead of field name */
  itemsPath?: string | ReadonlyArray<string>;

  /** optional: read total via path, instead of field name */
  totalCountPath?: string | ReadonlyArray<string>;

  /** optional: read item id via path */
  itemIdPath?: string | ReadonlyArray<string>;

  /** extra merge options */
  mergeOpts?: TCacheMergeOpts<TVariables>;
};

export function generateQueryPolicyConf<
  TQuery,
  TVariables,
  TFieldKey extends keyof TQuery & string = keyof TQuery & string,
  TItem = ResultItemOf<TQuery, TFieldKey>
>({
  key,
  entityTypename,
  cacheKeyVariables,
  entityIdFields,
  itemIdPath = [DEFAULT_QUERY_ID_KEY],
  itemsPath = [DEFAULT_QUERY_RESULTS_KEY],
  totalCountPath = [DEFAULT_QUERY_TOTAL_COUNT_KEY],
  paginationVariables = DEFAULT_OFFSET_PAGINATION,
  mergeOpts = { mode: 'wrapper' },
}: TGenerateQueryPolicyConf<TQuery, TVariables, TFieldKey, TItem>) {
  const isArrayMode = mergeOpts.mode === 'array';

  const normalizedMergeOpts: TCacheMergeOpts<TVariables> = isArrayMode
    ? mergeOpts
    : {
        itemsPath,
        totalCountPath,
        itemIdPath,
        ...mergeOpts,
      };

  const fieldPolicy: FieldPolicy = generateFieldPolicy<TItem, TVariables>({
    keyArgs: cacheKeyVariables as any,
    mergeOpts: normalizedMergeOpts,
    paginationVariables,
  });

  const keyFields = entityIdFields ?? itemIdPathToKeyFields(itemIdPath);

  return {
    key,
    buildFn: () => ({
      entityTypename,
      fieldPolicy,
      keyFields,
    }),
  } as const;
}

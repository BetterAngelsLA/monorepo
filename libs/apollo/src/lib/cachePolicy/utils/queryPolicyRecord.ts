/**
 * queryPolicyRecord
 *
 * A strongly-typed helper for declaring one entry in the Apollo cache policy registry.
 *
 * Goals:
 * - Ensure the provided `key` is a valid root field on the query result that contains a list
 *   under the given `resultsKey` (defaults to `"results"`).
 * - Ensure `entityTypename` matches the `__typename` of items returned by that field.
 * - Ensure every `keyArgs` entry is a valid variable key for the query's variables type.
 * - Build a ready-to-use Apollo `FieldPolicy` using your shared `generateFieldPolicy`.
 *
 * Type Parameters:
 * - Q  → Generated `*Query` type (e.g. `TasksQuery`).
 * - V  → Generated `*QueryVariables` type (e.g. `TasksQueryVariables`).
 * - RK → Results container key (defaults to `TDefaultResultsKey`, usually `"results"`).
 * - K  → Root field key on Q that resolves to a container with `RK` list.
 *
 * Usage:
 *
 * ```ts
 * const tasksPolicy = queryPolicyRecord<TasksQuery, TasksQueryVariables>({
 *   key: 'tasks',
 *   // resultsKey: 'results', // optional, defaults to DEFAULT_QUERY_RESULTS_KEY
 *   entityTypename: 'TaskType',
 *   keyArgs: ['filters', 'ordering'] as const,
 * });
 *
 * // Later, build into a registry
 * export const cachePolicyRegistry = {
 *   [tasksPolicy.key]: tasksPolicy.buildFn(),
 *   // ...other policies
 * };
 * ```
 *
 * Notes:
 * - If your query uses a container other than `"results"` (e.g. `"items"` or `"nodes"`),
 *   pass `resultsKey` explicitly.
 * - Keeps type-safety close to your generated types, so typos or mismatched typenames
 *   fail at compile time.
 */

import type { FieldPolicy } from '@apollo/client';
import { DEFAULT_QUERY_RESULTS_KEY } from '../constants';
import { generateFieldPolicy } from '../generateFieldPolicy';
import type {
  AllowedKeys,
  OffsetListKey,
  ResultItemOf,
  TDefaultResultsKey,
  TypenameOf,
} from './types';

type TProps<
  Q,
  V,
  RK extends string,
  K extends OffsetListKey<Q, RK> & string
> = {
  key: K;
  resultsKey?: RK;
  entityTypename: TypenameOf<ResultItemOf<Q, K, RK>>;
  keyArgs: readonly AllowedKeys<V>[];
};

export function queryPolicyRecord<
  Q,
  V,
  RK extends string = TDefaultResultsKey,
  K extends OffsetListKey<Q, RK> & string = OffsetListKey<Q, RK> & string
>(props: TProps<Q, V, RK, K>) {
  const { key, resultsKey, entityTypename, keyArgs } = props;

  return {
    key,
    resultsKey: resultsKey ?? DEFAULT_QUERY_RESULTS_KEY,
    buildFn: () => {
      const fieldPolicy: FieldPolicy = generateFieldPolicy({
        keyArgs: [...keyArgs],
      });

      return {
        entityTypename,
        fieldPolicy,
      } as const;
    },
  } as const;
}

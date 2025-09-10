/**
 * Strongly-typed builder for a single Apollo cache policy entry.
 *
 * `tasksPolicyConfig` is used when constructing your `cachePolicyRegistry`.
 * It validates at compile-time that:
 *
 *   • `key` is a valid **list-like field** on the query type `Q`
 *     (must be a field with a `.results` array, excludes `__typename`).
 *
 *   • `entityTypename` matches the literal `__typename` of the list items
 *     (so you can’t accidentally typo or mismatch the GraphQL typename).
 *
 *   • `keyArgs` are valid variable names for query type `V`, and cannot
 *     include `"pagination"` (enforced by `AllowedKeys<V>`).
 *
 * At runtime, the returned object contains:
 *
 *   {
 *     key:        the root field name (e.g. "tasks"),
 *     build: () => {
 *       entityTypename: "TaskType",
 *       fieldPolicy:    Apollo FieldPolicy generated from `keyArgs`
 *     }
 *   }
 *
 * You normally collect several of these into an array and then call
 * `buildUsing(entries)` to produce the final `cachePolicyRegistry`.
 *
 * Example:
 *
 * ```ts
 * const tasksPolicyConfig = queryPolicyConfig<TasksQuery, TasksQueryVariables>({
 *   key: 'tasks',                         // must be a key of TasksQuery
 *   entityTypename: 'TaskType',           // must match TasksQuery.tasks.results.__typename
 *   keyArgs: ['filters', 'ordering'] as const, // must be valid vars, excludes 'pagination'
 * });
 *
 * // Later combined via buildUsing([tasksPolicyConfig, ...])
 * ```
 *
 * @typeParam Q - GraphQL query result type (e.g. `TasksQuery`)
 * @typeParam V - GraphQL variables type for that query (e.g. `TasksQueryVariables`)
 */

import type { FieldPolicy } from '@apollo/client';
import { generateFieldPolicy } from '../generateFieldPolicy';
import type {
  AllowedKeys,
  OffsetListKey,
  ResultItemOf,
  TypenameOf,
} from './types';

export function queryPolicyConfig<Q, V>(cfg: {
  key: OffsetListKey<Q> & string;
  entityTypename: TypenameOf<ResultItemOf<Q, typeof cfg.key & keyof Q>>;
  keyArgs: readonly AllowedKeys<V>[];
}) {
  const { key, entityTypename, keyArgs } = cfg;

  type K = typeof key & OffsetListKey<Q> & string;

  // Optional compile-time assertion (ensures entityTypename matches literal)
  const _assert = (x: TypenameOf<ResultItemOf<Q, K>>) => x;
  _assert(entityTypename);

  return {
    key,
    build: () => {
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

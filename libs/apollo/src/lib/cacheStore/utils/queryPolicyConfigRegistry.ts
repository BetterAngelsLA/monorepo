import type { ApolloCache, TypePolicies } from '@apollo/client';
import type { QueryPolicyConfig } from '../../cachePolicy/types/queryPolicyConfig';

/**
 * Per-cache registry of `QueryPolicyConfig`s, keyed by the Query field name.
 *
 * `createApolloCache` registers the configs carried by the generated field
 * policies (see `generateCachePolicies`). Keeping them in a WeakMap — rather
 * than stashing metadata on the cache or on Apollo-owned policy objects —
 * makes the lookup explicit: a cache created outside `createApolloCache` has
 * no registered configs, and readers get `undefined` instead of a cast.
 */
const queryPolicyConfigsByCache = new WeakMap<
  ApolloCache,
  Map<string, QueryPolicyConfig>
>();

export function registerQueryPolicyConfigs(
  cache: ApolloCache,
  typePolicies?: TypePolicies,
): void {
  const configs = new Map<string, QueryPolicyConfig>();
  const queryFields = typePolicies?.['Query']?.fields ?? {};

  for (const [fieldName, fieldPolicy] of Object.entries(queryFields)) {
    const config = (fieldPolicy as Record<string, unknown> | undefined)?.[
      '__queryPolicyConfig'
    ];

    if (config) {
      configs.set(fieldName, config as QueryPolicyConfig);
    }
  }

  queryPolicyConfigsByCache.set(cache, configs);
}

export function getQueryPolicyConfigFromCache(
  cache: ApolloCache,
  fieldName: string,
): QueryPolicyConfig | undefined {
  return queryPolicyConfigsByCache.get(cache)?.get(fieldName);
}

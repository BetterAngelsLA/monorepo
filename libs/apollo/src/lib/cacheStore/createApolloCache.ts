import { InMemoryCache, TypePolicies } from '@apollo/client';
import { registerQueryPolicyConfigs } from './utils/queryPolicyConfigRegistry';

export type TCacheStore = {
  typePolicies?: TypePolicies;
};

export function createApolloCache(opts?: TCacheStore): InMemoryCache {
  const { typePolicies = {} } = opts || {};

  const cache = new InMemoryCache({
    typePolicies,
  });

  // Register the query policy configs carried by the generated field
  // policies so readers (e.g. useInfiniteScrollQuery) can find them. Caches
  // created outside this helper have no registered configs.
  registerQueryPolicyConfigs(cache, typePolicies);

  return cache;
}

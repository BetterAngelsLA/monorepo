import { InMemoryCache } from '@apollo/client';
import { generateCachePolicies } from '../cachePolicy';
import { TYPE_POLICIES_SYM } from '../cachePolicy/constants';
import { TCachePolicyConfig, TCacheWithPolicies } from '../cachePolicy/types';

export type TCacheStore = {
  policyConfig?: TCachePolicyConfig;
};

export function createApolloCache(opts?: TCacheStore): TCacheWithPolicies {
  const { policyConfig = {} } = opts || {};

  const typePolicies = generateCachePolicies(policyConfig);

  const cache = new InMemoryCache({
    typePolicies,
  }) as TCacheWithPolicies;

  // attach policy metadata for validation when needed
  cache[TYPE_POLICIES_SYM] = typePolicies;

  return cache;
}

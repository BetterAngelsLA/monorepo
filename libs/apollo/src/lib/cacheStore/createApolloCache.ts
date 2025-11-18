import { InMemoryCache } from '@apollo/client';
import {
  TCachePolicyConfig,
  TCacheWithPolicies,
  generateCachePolicies,
} from '../cachePolicy';
import { TYPE_POLICIES_SYM } from '../cachePolicy/constants';

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

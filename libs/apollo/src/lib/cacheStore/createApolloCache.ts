import { InMemoryCache, TypePolicies } from '@apollo/client';
import { TCacheWithPolicies } from '../cachePolicy';
import { TYPE_POLICIES_SYM } from '../cachePolicy/constants';

export type TCacheStore = {
  typePolicies?: TypePolicies;
};

export function createApolloCache(opts?: TCacheStore): TCacheWithPolicies {
  const { typePolicies = {} } = opts || {};

  const cache = new InMemoryCache({
    typePolicies,
  }) as TCacheWithPolicies;

  // attach policy metadata for validation when needed
  cache[TYPE_POLICIES_SYM] = typePolicies;

  return cache;
}

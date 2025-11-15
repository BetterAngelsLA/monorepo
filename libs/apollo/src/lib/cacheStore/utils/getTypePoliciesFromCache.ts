import { ApolloCache, TypePolicies } from '@apollo/client';
import { TCacheWithPolicies, TYPE_POLICIES_SYM } from '../../cachePolicy';

export function getTypePoliciesFromCache(
  cache: ApolloCache
): TypePolicies | undefined {
  if (!(TYPE_POLICIES_SYM in cache)) {
    const msg = `Active cache has no attached typePolicies. To validate cache policies, must attach them to cacheStore via TYPE_POLICIES_SYM: cache[${String(
      TYPE_POLICIES_SYM
    )}] = typePolicies`;

    console.warn('[getTypePoliciesFromCache] ', msg);
  }

  return (
    (cache as unknown as TCacheWithPolicies)[TYPE_POLICIES_SYM] ?? undefined
  );
}

import {
  ApolloCache,
  FieldPolicy,
  TypePolicies,
  TypePolicy,
} from '@apollo/client';
import { TYPE_POLICIES_SYM } from '../constants';
import { TCacheWithPolicies } from '../types';

export function getTypePoliciesFromCache(
  cache: ApolloCache<object>
): TypePolicies {
  if (!(TYPE_POLICIES_SYM in cache)) {
    throw new Error(
      'Active cache has no attached typePolicies. Build it via createCacheWithPolicies().'
    );
  }

  return (cache as unknown as TCacheWithPolicies)[TYPE_POLICIES_SYM];
}

export function assertQueryFieldHasMerge(
  cache: ApolloCache<object>,
  fieldName: string
) {
  const policies = getTypePoliciesFromCache(cache);

  const query = policies['Query'] as TypePolicy | undefined;

  const fields = (query?.fields ?? {}) as Record<
    string,
    FieldPolicy | undefined
  >;

  const fieldPolicy = fields[fieldName];

  if (!fieldPolicy || typeof fieldPolicy.merge !== 'function') {
    throw new Error(
      `[Apollo] Missing merge for Query.${fieldName}. Add keyArgs + merge in typePolicies.`
    );
  }
}

import type { ApolloCache, TypePolicy } from '@apollo/client';
import { getTypePoliciesFromCache } from './getTypePoliciesFromCache';

export function getTypePolicyFromCache(
  cache: ApolloCache<unknown>,
  typename: string
): TypePolicy | undefined {
  const typePolicies = getTypePoliciesFromCache(cache);

  return typePolicies?.[typename] as TypePolicy | undefined;
}

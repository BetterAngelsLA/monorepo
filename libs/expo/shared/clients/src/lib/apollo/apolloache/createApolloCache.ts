import { InMemoryCache } from '@apollo/client';
import { generateCachePolicies } from './cachePolicies';
import { TCachePoliyConfig } from './types';

export type TCacheStore = {
  policyMap?: TCachePoliyConfig;
};

export function createApolloCache(opts?: TCacheStore) {
  const { policyMap = {} } = opts || {};

  const policies = generateCachePolicies(policyMap);

  console.log();
  console.log('| ----- SHARED - createApolloCache - policies:');
  console.log(JSON.stringify(policies, null, 2));
  console.log();

  return new InMemoryCache({
    typePolicies: policies,
  });
}

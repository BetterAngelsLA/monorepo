import { createApolloCache } from '@monorepo/apollo';
import { createBaTypePolicies } from '../lib/apollo/cachePolicies/createBaTypePolicies';

/**
 * In-memory cache carrying the app's query policies, for tests that render
 * components using `useInfiniteScrollQuery` (the hook throws without them).
 * Uses the production `createApolloCache` so policy metadata is attached the
 * same way it is at runtime; dev warnings are disabled.
 */
export function createTestApolloCache() {
  return createApolloCache({ typePolicies: createBaTypePolicies(false) });
}

import {
  TCachePolicyConfig,
  assemblePolicyRegistry,
  getQueryPolicyFactory,
} from '@monorepo/apollo';
import {
  ViewSheltersQuery,
  ViewSheltersQueryVariables,
} from '../../pages/shelters/__generated__/shelters.generated';

const policyFactoryList = [
  getQueryPolicyFactory<ViewSheltersQuery, ViewSheltersQueryVariables>({
    key: 'shelters',
    entityTypename: 'ShelterType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
  }),
] as const;

/**
 * Cache normalization policies for paginated queries.
 *
 * Each entry tells Apollo how to merge, evict, and key paginated results —
 * e.g. {@code ViewSheltersQuery} under the top-level key {@code shelters},
 * where each entity is typed as {@code ShelterType} and cache keys vary by
 * {@code filters} and {@code ordering}.
 */
export function createShelterApolloCachePolicyRegistry(
  isDevEnv: boolean,
): TCachePolicyConfig {
  return assemblePolicyRegistry(policyFactoryList, {
    isDevEnv: isDevEnv,
  }) satisfies TCachePolicyConfig;
}

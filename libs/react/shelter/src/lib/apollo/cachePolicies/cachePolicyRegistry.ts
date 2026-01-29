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

export function createShelterApolloCachePolicyRegistry(
  isDevEnv: boolean
): TCachePolicyConfig {
  return assemblePolicyRegistry(policyFactoryList, {
    isDevEnv: isDevEnv,
  }) satisfies TCachePolicyConfig;
}

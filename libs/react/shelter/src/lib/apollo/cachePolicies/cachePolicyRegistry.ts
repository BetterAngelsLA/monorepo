import {
  TCachePolicyConfig,
  assemblePolicyRegistry,
  getQueryPolicyFactory,
} from '@monorepo/apollo';
import {
  ViewSheltersQuery,
  ViewSheltersQueryVariables,
} from '@monorepo/react/shelter';

const policyFactoryList = [
  getQueryPolicyFactory<ViewSheltersQuery, ViewSheltersQueryVariables>({
    key: 'shelters',
    entityTypename: 'ShelterType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
  }),
] as const;

export const cachePolicyRegistry = assemblePolicyRegistry(
  policyFactoryList
) satisfies TCachePolicyConfig;

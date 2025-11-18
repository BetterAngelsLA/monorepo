import {
  PaginationModeEnum,
  TCachePolicyConfig,
  assemblePolicyRegistry,
  getQueryPolicyFactory,
} from '@monorepo/apollo';
import {
  HmisClientProfilesQuery,
  HmisClientProfilesQueryVariables,
} from '../../ui-components/ClientProfileList/__generated__/HmisListClients.generated';
import {
  FilterClientProfilesQuery,
  FilterClientProfilesQueryVariables,
} from '../../ui-components/Filters/FilterClients/__generated__/filterClientProfiles.generated';
import {
  FilterOrganizationsQuery,
  FilterOrganizationsQueryVariables,
} from '../../ui-components/Filters/FilterOrganizations/__generated__/filterOrganizations.generated';
import {
  FilterUsersQuery,
  FilterUsersQueryVariables,
} from '../../ui-components/Filters/FilterUsers/__generated__/filterUsers.generated';
import {
  TasksQuery,
  TasksQueryVariables,
} from '../../ui-components/TaskList/__generated__/Tasks.generated';

const policyFactoryList = [
  getQueryPolicyFactory<
    FilterClientProfilesQuery,
    FilterClientProfilesQueryVariables
  >({
    key: 'clientProfiles',
    entityTypename: 'ClientProfileType',
    cacheKeyVariables: ['filters', 'order'] as const,
  }),
  getQueryPolicyFactory<FilterUsersQuery, FilterUsersQueryVariables>({
    key: 'interactionAuthors',
    entityTypename: 'InteractionAuthorType',
    cacheKeyVariables: ['filters', 'order'] as const,
  }),
  getQueryPolicyFactory<
    FilterOrganizationsQuery,
    FilterOrganizationsQueryVariables
  >({
    key: 'caseworkerOrganizations',
    entityTypename: 'OrganizationType',
    cacheKeyVariables: ['filters', 'order'] as const,
  }),
  getQueryPolicyFactory<TasksQuery, TasksQueryVariables>({
    key: 'tasks',
    entityTypename: 'TaskType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
  }),

  getQueryPolicyFactory<
    HmisClientProfilesQuery,
    HmisClientProfilesQueryVariables
  >({
    key: 'hmisClientProfiles',
    entityTypename: 'HmisClientProfileType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
    itemIdPath: 'id',
    itemsPath: 'items',
    totalCountPath: ['totalCount'],
    paginationMode: PaginationModeEnum.PerPage,
  }),
] as const;

export const cachePolicyRegistry = assemblePolicyRegistry(
  policyFactoryList
) satisfies TCachePolicyConfig;

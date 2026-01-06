import {
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
  InteractionsQuery,
  InteractionsQueryVariables,
} from '../../ui-components/InteractionList/__generated__/Interactions.generated';
import {
  InteractionListHmisQuery,
  InteractionListHmisQueryVariables,
} from '../../ui-components/InteractionListHmis/__generated__/interactionListHmis.generated';
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
    cacheKeyVariables: ['filters', 'ordering'] as const,
  }),
  getQueryPolicyFactory<FilterUsersQuery, FilterUsersQueryVariables>({
    key: 'interactionAuthors',
    entityTypename: 'InteractionAuthorType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
  }),
  getQueryPolicyFactory<
    FilterOrganizationsQuery,
    FilterOrganizationsQueryVariables
  >({
    key: 'caseworkerOrganizations',
    entityTypename: 'OrganizationType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
  }),
  getQueryPolicyFactory<TasksQuery, TasksQueryVariables>({
    key: 'tasks',
    entityTypename: 'TaskType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
  }),
  getQueryPolicyFactory<InteractionsQuery, InteractionsQueryVariables>({
    key: 'notes',
    entityTypename: 'NoteType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
  }),
  getQueryPolicyFactory<
    InteractionListHmisQuery,
    InteractionListHmisQueryVariables
  >({
    key: 'hmisNotes',
    entityTypename: 'HmisNoteType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
  }),
  getQueryPolicyFactory<
    HmisClientProfilesQuery,
    HmisClientProfilesQueryVariables
  >({
    key: 'hmisClientProfiles',
    entityTypename: 'HmisClientProfileType',
    cacheKeyVariables: ['filters', 'ordering'] as const,
  }),
] as const;

export const cachePolicyRegistry = assemblePolicyRegistry(
  policyFactoryList
) satisfies TCachePolicyConfig;

// TODO: add back docs once API stabilizes

import { TCachePolicyConfig } from '@monorepo/apollo';
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
import { buildEntry } from './buildUtils/buildEntry';
import { buildPolicies } from './buildUtils/buildPolicies';

const policyConfig = [
  buildEntry<TasksQuery, TasksQueryVariables>({
    key: 'tasks',
    entityTypename: 'TaskType',
    keyArgs: ['filters', 'ordering'] as const,
  }),
  buildEntry<FilterClientProfilesQuery, FilterClientProfilesQueryVariables>({
    key: 'clientProfiles',
    entityTypename: 'ClientProfileType',
    keyArgs: ['filters', 'order'] as const,
  }),
  buildEntry<FilterUsersQuery, FilterUsersQueryVariables>({
    key: 'interactionAuthors',
    entityTypename: 'InteractionAuthorType',
    keyArgs: ['filters', 'order'] as const,
  }),
  buildEntry<FilterOrganizationsQuery, FilterOrganizationsQueryVariables>({
    key: 'caseworkerOrganizations',
    entityTypename: 'OrganizationType',
    keyArgs: ['filters', 'order'] as const,
  }),
  buildEntry<FilterOrganizationsQuery, FilterOrganizationsQueryVariables>({
    key: 'caseworkerOrganizations',
    entityTypename: 'OrganizationType',
    keyArgs: ['filters', 'order'] as const,
  }),
] as const;

export const cachePolicyRegistry: TCachePolicyConfig =
  buildPolicies(policyConfig);

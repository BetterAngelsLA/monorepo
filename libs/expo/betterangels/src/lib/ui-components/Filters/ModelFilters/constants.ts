import { TFilterOption } from '@monorepo/expo/shared/ui-components';
import { enumDisplaySelahTeam, enumDisplayTaskStatus } from '../../../static';
import {
  TModelFilterFullConfig,
  TModelFilterType,
  TModelFilters,
} from './types';

export const nullModelilters: TModelFilters = {
  authors: [],
  clientProfiles: [],
  hmisClientProfiles: [],
  taskStatus: [],
  teams: [],
  organizations: [],
};

export const modelFilterConfigDefault: Record<
  TModelFilterType,
  Omit<TModelFilterFullConfig, 'type'>
> = {
  teams: {
    buttonLabel: 'All Teams',
    headerTitle: 'Filter - Teams',
    searchPlaceholder: 'Search teams',
  },
  authors: {
    buttonLabel: 'All Authors',
    headerTitle: 'Filter - Author',
    searchPlaceholder: 'Search authors',
  },
  organizations: {
    buttonLabel: 'All Organizations',
    headerTitle: 'Filter - Organizations',
    searchPlaceholder: 'Search organizations',
  },
  clientProfiles: {
    buttonLabel: 'Clients',
    headerTitle: 'Filter - Client',
    searchPlaceholder: 'Search clients',
  },
  hmisClientProfiles: {
    buttonLabel: 'Clients',
    headerTitle: 'Filter - Client',
    searchPlaceholder: 'Search clients',
  },
  taskStatus: {
    buttonLabel: 'Status',
    headerTitle: 'Filter - Status',
    searchPlaceholder: 'Search status',
  },
};

export const taskStatusOptions: TFilterOption[] = Object.entries(
  enumDisplayTaskStatus
).map(([key, value]) => ({
  id: key,
  label: value,
}));

export const teamOptions: TFilterOption[] = Object.entries(
  enumDisplaySelahTeam
).map(([key, value]) => ({
  id: key,
  label: value,
}));

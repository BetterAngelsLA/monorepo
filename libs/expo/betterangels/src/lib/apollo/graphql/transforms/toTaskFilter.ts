import { toNonEmptyStringOrUndefined } from '@monorepo/expo/shared/utils';
import {
  IdFilterLookup,
  SelahTeamEnum,
  TaskFilter,
  TaskStatusEnum,
} from '../__generated__/types';
import { toEnumArray } from './toEnumArray';

function pruneFilter<T extends Record<string, unknown>>(filter: T): Partial<T> {
  const pruned: Partial<T> = {};

  const keys = Object.keys(filter) as Array<keyof T>;

  for (const key of keys) {
    const value = filter[key];

    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    // Keep null explicitly
    pruned[key] = value;
  }

  return pruned;
}

type TProps = {
  search?: string;
  authors?: string[];
  organizations?: string[];
  teams?: string[];
  taskStatus?: string[];
  clientProfiles?: string[];
  hmisClientProfiles?: string[];
  hmisNote?: IdFilterLookup;
  note?: IdFilterLookup;
  hmisClientProfileLookup?: IdFilterLookup;
  clientProfileLookup?: IdFilterLookup;
  createdBy?: string;
};

export function toTaskFilter(props: TProps): TaskFilter {
  const {
    search,
    authors,
    organizations,
    clientProfiles,
    hmisClientProfiles,
    teams,
    taskStatus,
    hmisNote,
    note,
    hmisClientProfileLookup,
    clientProfileLookup,
    createdBy,
  } = props;

  const allFilters: TaskFilter = {
    search: toNonEmptyStringOrUndefined(search),
    authors,
    organizations,
    clientProfiles,
    hmisClientProfiles,
    hmisNote,
    note,
    hmisClientProfileLookup,
    clientProfileLookup,
    createdBy: toNonEmptyStringOrUndefined(createdBy),
    teams: toEnumArray<SelahTeamEnum>(SelahTeamEnum, teams),
    status: toEnumArray<TaskStatusEnum>(TaskStatusEnum, taskStatus),
  };

  return pruneFilter(allFilters);
}

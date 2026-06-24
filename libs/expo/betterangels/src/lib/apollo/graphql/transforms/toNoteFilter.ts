import { toNonEmptyStringOrUndefined } from '@monorepo/expo/shared/utils';
import { NoteFilter, SelahTeamEnum } from '../__generated__/types';
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

    // Keep null and bool etc
    pruned[key] = value;
  }

  return pruned;
}

type TProps = {
  search?: string;
  authors?: string[];
  organizations?: string[];
  teams?: string[];
  clientProfile?: string;
  createdBy?: string;
  isSubmitted?: boolean;
};

export function toNoteFilter(props: TProps): NoteFilter {
  const {
    search,
    authors,
    organizations,
    teams,
    clientProfile,
    createdBy,
    isSubmitted,
  } = props;

  const allFilters: NoteFilter = {
    search: toNonEmptyStringOrUndefined(search),
    authors,
    organizations,
    teams: toEnumArray<SelahTeamEnum>(SelahTeamEnum, teams),
    clientProfile: toNonEmptyStringOrUndefined(clientProfile),
    createdBy: toNonEmptyStringOrUndefined(createdBy),
    isSubmitted,
  };

  return pruneFilter(allFilters);
}

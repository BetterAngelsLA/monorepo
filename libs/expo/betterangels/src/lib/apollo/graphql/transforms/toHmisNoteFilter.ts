import { toNonEmptyStringOrUndefined } from '@monorepo/expo/shared/utils';
import { HmisNoteFilter } from '../__generated__/types';

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
  hmisClientProfile?: string;
  createdBy?: string;
};

export function toHmisNoteFilter(props: TProps): HmisNoteFilter {
  const { search, authors, hmisClientProfile, createdBy } = props;

  const allFilters: HmisNoteFilter = {
    search: toNonEmptyStringOrUndefined(search),
    authors,
    hmisClientProfile: toNonEmptyStringOrUndefined(hmisClientProfile),
    createdBy: toNonEmptyStringOrUndefined(createdBy),
  };

  return pruneFilter(allFilters);
}

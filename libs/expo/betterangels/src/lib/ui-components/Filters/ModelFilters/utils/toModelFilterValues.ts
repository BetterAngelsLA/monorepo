import { TModelFilterType, TModelFilters } from '../types';

export function toModelFilterValues(filters: TModelFilters) {
  const result: Partial<Record<TModelFilterType, string[]>> = {};

  const filterKeys = Object.keys(filters) as TModelFilterType[];

  for (const filterKey of filterKeys) {
    const options = filters[filterKey];

    if (!options) {
      continue;
    }

    const ids = options.map((option) => option.id).filter((id) => Boolean(id));

    result[filterKey] = ids;
  }

  return result;
}

import { atomWithReset } from 'jotai/utils';

export type TOperatorShelterFilters = Record<string, string[]>;

export const nullOperatorShelterFilters: TOperatorShelterFilters = {
  demographics: [],
  specialSituationRestrictions: [],
  shelterTypes: [],
};

export const operatorShelterFiltersAtom =
  atomWithReset<TOperatorShelterFilters>(nullOperatorShelterFilters);

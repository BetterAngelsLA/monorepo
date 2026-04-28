import { atomWithReset } from 'jotai/utils';

export type TOperatorShelterFilters = {
  demographics: string[];
  specialSituationRestrictions: string[];
  shelterTypes: string[];
};

export const nullOperatorShelterFilters: TOperatorShelterFilters = {
  demographics: [],
  specialSituationRestrictions: [],
  shelterTypes: [],
};

export const operatorShelterFiltersAtom =
  atomWithReset<TOperatorShelterFilters>(nullOperatorShelterFilters);

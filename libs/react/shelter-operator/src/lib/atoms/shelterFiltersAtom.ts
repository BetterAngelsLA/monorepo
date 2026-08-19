import { atomWithReset } from 'jotai/utils';

export type TOperatorShelterFilters = {
  demographics: string[];
  accessibility: string[];
  entryRequirements: string[];
  parking: string[];
  pets: string[];
  referralRequirement: string[];
  roomStyles: string[];
  shelterTypes: string[];
  specialSituationRestrictions: string[];
};

export const nullOperatorShelterFilters: TOperatorShelterFilters = {
  demographics: [],
  accessibility: [],
  entryRequirements: [],
  parking: [],
  pets: [],
  referralRequirement: [],
  roomStyles: [],
  shelterTypes: [],
  specialSituationRestrictions: [],
};

export const operatorShelterFiltersAtom =
  atomWithReset<TOperatorShelterFilters>(nullOperatorShelterFilters);

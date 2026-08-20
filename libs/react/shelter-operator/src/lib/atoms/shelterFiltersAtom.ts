import { atomWithReset } from 'jotai/utils';

export type TOperatorShelterFilters = {
  // ShelterPropertyInput fields
  accessibility: string[];
  demographics: string[];
  entryRequirements: string[];
  funders: string[];
  parking: string[];
  pets: string[];
  referralRequirement: string[];
  roomStyles: string[];
  shelterPrograms: string[];
  shelterTypes: string[];
  specialSituationRestrictions: string[];
  storage: string[];
  // Top-level OperatorShelterFilter fields
  city: string[];
  citiesServed: string[];
  cityCouncilDistrict: string[];
  isPrivate: string[]; // ["true"] | ["false"] | []
  onSiteSecurity: string[]; // ["true"] | ["false"] | []
  organizations: string[];
  overallRating: string[];
  services: string[];
  spa: string[];
  spasServed: string[];
  status: string[];
  supervisorialDistrict: string[];
  maxStayDays: string; // "" means unset
};

export const nullOperatorShelterFilters: TOperatorShelterFilters = {
  accessibility: [],
  demographics: [],
  entryRequirements: [],
  funders: [],
  parking: [],
  pets: [],
  referralRequirement: [],
  roomStyles: [],
  shelterPrograms: [],
  shelterTypes: [],
  specialSituationRestrictions: [],
  storage: [],
  city: [],
  citiesServed: [],
  cityCouncilDistrict: [],
  isPrivate: [],
  onSiteSecurity: [],
  organizations: [],
  overallRating: [],
  services: [],
  spa: [],
  spasServed: [],
  status: [],
  supervisorialDistrict: [],
  maxStayDays: '',
};

export const operatorShelterFiltersAtom =
  atomWithReset<TOperatorShelterFilters>(nullOperatorShelterFilters);

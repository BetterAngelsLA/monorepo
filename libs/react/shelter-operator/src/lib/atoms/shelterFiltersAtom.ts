import { atomWithReset } from 'jotai/utils';

export type TOperatorShelterFilters = {
  // ShelterPropertyInput fields
  demographics: string[];
  entryRequirements: string[];
  funders: string[];
  parking: string[];
  pets: string[];
  referralRequirement: string[];
  roomStyles: string[];
  shelterTypes: string[];
  specialSituationRestrictions: string[];
  // Top-level OperatorShelterFilter fields
  accessibility: string[];
  city: string[];
  citiesServed: string[];
  cityCouncilDistrict: string[];
  isPrivate: string[]; // ["true"] | ["false"] | []
  onSiteSecurity: string[]; // ["true"] | ["false"] | []
  organizations: string[];
  overallRating: string[];
  services: string[];
  shelterPrograms: string[];
  spa: string[];
  spasServed: string[];
  status: string[];
  storage: string[];
  supervisorialDistrict: string[];
  maxStayDays: string; // "" means unset
};

export const nullOperatorShelterFilters: TOperatorShelterFilters = {
  demographics: [],
  entryRequirements: [],
  funders: [],
  parking: [],
  pets: [],
  referralRequirement: [],
  roomStyles: [],
  shelterTypes: [],
  specialSituationRestrictions: [],
  accessibility: [],
  city: [],
  citiesServed: [],
  cityCouncilDistrict: [],
  isPrivate: [],
  onSiteSecurity: [],
  organizations: [],
  overallRating: [],
  services: [],
  shelterPrograms: [],
  spa: [],
  spasServed: [],
  status: [],
  storage: [],
  supervisorialDistrict: [],
  maxStayDays: '',
};

export const operatorShelterFiltersAtom =
  atomWithReset<TOperatorShelterFilters>(nullOperatorShelterFilters);

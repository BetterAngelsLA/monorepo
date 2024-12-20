import { atomWithReset } from 'jotai/utils';
import { TShelterPropertyFilters } from '../components/shelters/sheltersDisplay';

export const nullShelterFilters = {
  pets: [],
  demographics: [],
  specialSituationRestrictions: [],
  // shelterType: [],
  // roomStyle: [],
  parking: [],
};

export const shelterFiltersAtom =
  atomWithReset<TShelterPropertyFilters>(nullShelterFilters);

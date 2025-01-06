import { atomWithReset } from 'jotai/utils';
import { TShelterPropertyFilters } from '../components/shelters/sheltersDisplay';

export const nullShelterFilters: TShelterPropertyFilters = {
  pets: [],
  demographics: [],
  specialSituationRestrictions: [],
  shelterTypes: [],
  roomStyles: [],
  parking: [],
};

export const shelterFiltersAtom =
  atomWithReset<TShelterPropertyFilters>(nullShelterFilters);

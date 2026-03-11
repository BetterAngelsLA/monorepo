import { atomWithReset } from 'jotai/utils';
import { TShelterPropertyFilters } from '../components/ShelterSearch';

export const nullShelterFilters: TShelterPropertyFilters = {
  openNow: false,
  pets: [],
  demographics: [],
  specialSituationRestrictions: [],
  shelterTypes: [],
  roomStyles: [],
  parking: [],
};

export const shelterFiltersAtom =
  atomWithReset<TShelterPropertyFilters>(nullShelterFilters);

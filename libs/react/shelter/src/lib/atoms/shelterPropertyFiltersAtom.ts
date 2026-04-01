import { atomWithReset } from 'jotai/utils';
import { TShelterPropertyFilters } from '../components/ShelterSearch';

export const nullShelterPropertyFilters: TShelterPropertyFilters = {
  openNow: false,
  pets: [],
  demographics: [],
  specialSituationRestrictions: [],
  shelterTypes: [],
  roomStyles: [],
  parking: [],
};

export const shelterPropertyFiltersAtom =
  atomWithReset<TShelterPropertyFilters>(nullShelterPropertyFilters);

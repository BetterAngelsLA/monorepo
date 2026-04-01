import { atomWithReset } from 'jotai/utils';
import { TShelterPropertyFilters } from '../components/ShelterSearch';

export const nullSheltePropertyFilters: TShelterPropertyFilters = {
  openNow: false,
  pets: [],
  demographics: [],
  specialSituationRestrictions: [],
  shelterTypes: [],
  roomStyles: [],
  parking: [],
};

export const shelterPropertyFiltersAtom =
  atomWithReset<TShelterPropertyFilters>(nullSheltePropertyFilters);

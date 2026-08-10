import { atomWithReset } from 'jotai/utils';
import { TShelterPropertyFilters } from '../components/ShelterSearch';

export const nullShelterPropertyFilters: TShelterPropertyFilters = {
  openNow: undefined,
  openNowScheduleTypes: undefined,
  openNowIncludeNull: undefined,
  isAccessCenter: undefined,
  pets: [],
  demographics: [],
  specialSituationRestrictions: [],
  shelterTypes: [],
  roomStyles: [],
  parking: [],
};

export const shelterPropertyFiltersAtom =
  atomWithReset<TShelterPropertyFilters>(nullShelterPropertyFilters);

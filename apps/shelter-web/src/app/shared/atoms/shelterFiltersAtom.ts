import { atom } from 'jotai';
import { TShelterPropertyFilters } from '../components/shelters/sheltersDisplay';

const defaultValues = {
  pets: [],
  demographics: [],
  specialSituationRestrictions: [],
  shelterType: [],
  roomStyle: [],
  parking: [],
};

export const shelterFiltersAtom = atom<TShelterPropertyFilters>(defaultValues);

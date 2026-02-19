import { atom } from 'jotai';
import type { Shelter } from '../types/shelter';

export const sheltersAtom = atom<Shelter[]>([]);
export const searchQueryAtom = atom('');
export const filteredSheltersAtom = atom((get) => {
  const query = get(searchQueryAtom).toLowerCase();
  return get(sheltersAtom).filter(
    (shelter) => shelter.name?.toLowerCase().includes(query) ?? false
  );
});

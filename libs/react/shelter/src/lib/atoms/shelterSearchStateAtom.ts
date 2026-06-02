import { atom } from 'jotai';
import { TLatLng, TMapBounds } from '../components/Map';

/** The name text currently in the search input (kept in sync so SearchPage pre-populates correctly). */
export const shelterNameSearchValueAtom = atom('');

export type TSearchSubmission = {
  nameValue: string;
  pendingLocation: { location: TLatLng; mapBounds?: TMapBounds } | null;
};

/**
 * Written by SearchPage when the user confirms their search.
 * ShelterSearch watches this and applies the search, then clears it.
 */
export const shelterSearchSubmissionAtom = atom<TSearchSubmission | null>(null);

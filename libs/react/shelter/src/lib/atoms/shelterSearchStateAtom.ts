import { atom } from 'jotai';
import { TLatLng, TMapBounds } from '../components/Map';

/**
 * Incrementing this atom fires a new shelter search.
 * Consumers freeze their query variables at the moment this value changes
 * so that intermediate filter-state updates don't trigger spurious queries.
 */
export const shelterSearchTriggerAtom = atom(0);

/** The name text currently in the search input (kept in sync so SearchPage pre-populates correctly). */
export const shelterNameSearchInputAtom = atom('');

/**
 * The committed name filter for the active query.
 * Stored as an atom (not component state) so it updates atomically with
 * shelterSearchTriggerAtom, avoiding a render where the trigger has incremented
 * but the name search hasn't propagated yet.
 */
export const shelterNameSearchAtom = atom<string | undefined>(undefined);

export type TShelterSearchRequest = {
  name: string;
  location: TLatLng | null;
  mapBounds?: TMapBounds;
};

/**
 * Written by SearchPage when the user confirms their search.
 * ShelterSearch watches this and applies the search, then clears it.
 */
export const shelterSearchRequestAtom = atom<TShelterSearchRequest | null>(null);

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

/** The location text currently in the search input (kept in sync so SearchPage pre-populates correctly). */
export const shelterLocationSearchInputAtom = atom('');

/**
 * The committed name filter for the active query.
 * Stored as an atom (not component state) so it updates atomically with
 * shelterSearchTriggerAtom, avoiding a render where the trigger has incremented
 * but the name search hasn't propagated yet.
 */
export const shelterNameSearchAtom = atom<string | undefined>(undefined);

export type TShelterSearchPendingLocation = {
  location: TLatLng;
  mapBounds?: TMapBounds;
  /** Display text shown in the address input (the formatted address). */
  displayText: string;
};

/**
 * Persists the last location selected in the search overlay so it can be
 * restored when the user navigates back to the search page.
 */
export const shelterSearchPendingLocationAtom =
  atom<TShelterSearchPendingLocation | null>(null);

/** The location last applied to the map from a search submission. */
export const shelterSearchAppliedLocationAtom = atom<TLatLng | null>(null);

export type TShelterSearchRequest = {
  name: string;
  location: TLatLng | null;
  mapBounds?: TMapBounds;
  displayText?: string;
};

/**
 * Written by SearchPage when the user confirms their search.
 * ShelterSearch watches this and applies the search, then clears it.
 */
export const shelterSearchRequestAtom = atom<TShelterSearchRequest | null>(null);

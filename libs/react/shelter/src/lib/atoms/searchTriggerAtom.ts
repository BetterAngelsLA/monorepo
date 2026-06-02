import { atom } from 'jotai';

/**
 * Incrementing this atom fires a new shelter search.
 * Consumers freeze their query variables at the moment this value changes
 * so that intermediate filter-state updates don't trigger spurious queries.
 */
export const searchTriggerAtom = atom(0);

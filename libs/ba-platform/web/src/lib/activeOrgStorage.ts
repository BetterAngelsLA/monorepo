import {
  ACTIVE_ORG_STORAGE_KEY,
  type ActiveOrgPersistence,
} from '@monorepo/ba-platform';

/** ``localStorage``-backed persistence for the active organization id. */
export const webActiveOrgStorage: ActiveOrgPersistence = {
  get: () => localStorage.getItem(ACTIVE_ORG_STORAGE_KEY),
  set: (value) =>
    value === null
      ? localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY)
      : localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, value),
};

import {
  createActiveOrgPersistence,
  ACTIVE_ORG_STORAGE_KEY,
} from '@monorepo/ba-platform';

/** ``localStorage``-backed persistence for the active organization id. */
export const webActiveOrgStorage = createActiveOrgPersistence({
  read: () => localStorage.getItem(ACTIVE_ORG_STORAGE_KEY),
  write: (value) => localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, value),
  remove: () => localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY),
});

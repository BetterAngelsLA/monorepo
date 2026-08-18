import {
  createActiveOrgPersistence,
  DEFAULT_ORG_STORAGE_KEY,
} from '@monorepo/ba-platform';

/** ``localStorage``-backed persistence for the active organization id. */
export const webActiveOrgStorage = createActiveOrgPersistence({
  read: () => localStorage.getItem(DEFAULT_ORG_STORAGE_KEY),
  write: (value) => localStorage.setItem(DEFAULT_ORG_STORAGE_KEY, value),
  remove: () => localStorage.removeItem(DEFAULT_ORG_STORAGE_KEY),
});

import { DEFAULT_ORG_STORAGE_KEY, type SyncOrgStorage } from '@monorepo/ba-platform';

/**
 * ``localStorage``-backed synchronous storage for the active organization id.
 *
 * ``localStorage`` is already synchronous, so this is a thin shim that exists
 * to give web and React Native the same shape — see the MMKV equivalent in
 * ``@monorepo/ba-platform/expo``.
 */
export const webActiveOrgStorage: SyncOrgStorage = {
  get() {
    try {
      return typeof localStorage !== 'undefined'
        ? localStorage.getItem(DEFAULT_ORG_STORAGE_KEY)
        : null;
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      if (typeof localStorage === 'undefined') return;
      if (value === null) localStorage.removeItem(DEFAULT_ORG_STORAGE_KEY);
      else localStorage.setItem(DEFAULT_ORG_STORAGE_KEY, value);
    } catch {
      // storage may be unavailable (private mode, quota)
    }
  },
};

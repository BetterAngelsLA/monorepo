import { createPersistentSynchronousStorage } from '@monorepo/expo/shared/utils';
import { atomWithStorage } from 'jotai/utils';
import type { SyncStorage } from 'jotai/vanilla/utils/atomWithStorage';
import type { TSortDirection } from '../../ui-components';

export const SORT_DIRECTION_STORAGE_KEY = 'sortDirection';
export const DEFAULT_SORT_DIRECTION: TSortDirection = 'newestFirst';

const isSortDirection = (value: unknown): value is TSortDirection =>
  value === 'newestFirst' || value === 'oldestFirst';

// Created lazily so importing this module (via the state barrel) does not
// touch the native MMKV module before the app needs it — the same convention
// as userPreferencesState and the active-org storage.
let store: ReturnType<typeof createPersistentSynchronousStorage> | undefined;
const getStore = () => (store ??= createPersistentSynchronousStorage());

const storage: SyncStorage<TSortDirection> = {
  getItem(key, initialValue) {
    const stored = getStore().get<TSortDirection>(key);

    return isSortDirection(stored) ? stored : initialValue;
  },
  setItem(key, value) {
    getStore().set<TSortDirection>(key, value);
  },
  removeItem(key) {
    getStore().remove(key);
  },
};

/**
 * The last sort direction the user picked, shared by every sortable list.
 *
 * MMKV is synchronous, so the first render already shows the stored direction
 * (no flicker back to the default). It lives in the app-wide MMKV instance —
 * it carries no personal data, and there is no user to scope by before sign-in.
 */
export const sortDirectionState = atomWithStorage<TSortDirection>(
  SORT_DIRECTION_STORAGE_KEY,
  DEFAULT_SORT_DIRECTION,
  storage,
);

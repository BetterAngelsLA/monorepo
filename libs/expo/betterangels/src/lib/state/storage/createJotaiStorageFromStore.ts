import { StateStorageSyncApi } from '@monorepo/expo/shared/utils';
import type { SyncStorage } from 'jotai/vanilla/utils/atomWithStorage';

export function adaptToJotaiStorage<T>(
  store: StateStorageSyncApi
): SyncStorage<T> {
  return {
    getItem(key: string, initialValue: T): T {
      const storedValue = store.get<T>(key);

      if (storedValue === null) {
        return initialValue;
      }

      return storedValue;
    },

    setItem(key: string, value: T): void {
      store.set<T>(key, value);
    },

    removeItem(key: string): void {
      store.remove(key);
    },
  };
}

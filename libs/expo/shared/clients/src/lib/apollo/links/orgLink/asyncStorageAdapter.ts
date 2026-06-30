import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from '@monorepo/react/shared';

/**
 * ``StorageAdapter`` backed by React Native ``AsyncStorage``.
 *
 * Used internally by ``expoOrgLink`` to persist the active
 * organization ID.
 */
export const asyncStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
};

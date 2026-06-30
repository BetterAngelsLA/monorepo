import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from '@monorepo/react/shared';

/**
 * ``StorageAdapter`` backed by React Native ``AsyncStorage``.
 *
 * Use with :func:`createOrgLink` from ``@monorepo/ba-platform`` to
 * attach the ``X-Organization-ID`` header in Expo / React Native apps.
 */
export const asyncStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
};

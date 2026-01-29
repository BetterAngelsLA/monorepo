import { createMMKV } from 'react-native-mmkv';
import { PersistentSynchronousStorageApi } from './types';

type TConfig = {
  scopeId: string;
};

export function createPersistentSynchronousStorage(
  config?: TConfig
): PersistentSynchronousStorageApi {
  const mmkv = createMMKV(config ? { id: config.scopeId } : undefined);

  return {
    get<T>(key: string): T | null {
      const raw = mmkv.getString(key);

      if (raw === undefined) {
        return null;
      }

      return JSON.parse(raw) as T;
    },

    set<T>(key: string, value: T): void {
      mmkv.set(key, JSON.stringify(value));
    },

    remove(key: string): void {
      mmkv.remove(key);
    },

    clearAll(): void {
      mmkv.clearAll();
    },
  };
}

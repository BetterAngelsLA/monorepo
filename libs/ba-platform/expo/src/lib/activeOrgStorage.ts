import { DEFAULT_ORG_STORAGE_KEY, type SyncOrgStorage } from '@monorepo/ba-platform';
import { createMMKV } from 'react-native-mmkv';

/**
 * MMKV-backed synchronous storage for the active organization id.
 *
 * MMKV rather than ``AsyncStorage`` because this value must be readable
 * *synchronously*: the fetch interceptor reads it per request, and
 * ``useSyncExternalStore`` reads it during render. An ``AsyncStorage`` round
 * trip cannot satisfy either, which is what made the header lag the UI.
 *
 * MMKV is already a dependency of the app and already backs
 * ``userPreferencesState``.
 *
 * Note: values previously written to ``AsyncStorage`` under this key are not
 * migrated. Users land on their first organization once, and the choice sticks
 * from then on.
 */
const mmkv = createMMKV();

export const expoActiveOrgStorage: SyncOrgStorage = {
  get() {
    try {
      return mmkv.getString(DEFAULT_ORG_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      if (value === null) mmkv.remove(DEFAULT_ORG_STORAGE_KEY);
      else mmkv.set(DEFAULT_ORG_STORAGE_KEY, value);
    } catch {
      // storage may be unavailable
    }
  },
};

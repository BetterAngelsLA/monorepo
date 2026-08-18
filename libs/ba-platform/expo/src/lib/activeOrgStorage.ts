import {
  createActiveOrgPersistence,
  DEFAULT_ORG_STORAGE_KEY,
} from '@monorepo/ba-platform';
import { createMMKV } from 'react-native-mmkv';

const mmkv = createMMKV();

/**
 * MMKV-backed persistence for the active organization id.
 *
 * MMKV rather than ``AsyncStorage`` because this value is read during render
 * and on every request, neither of which can await.
 *
 * Values previously written to ``AsyncStorage`` under this key are not
 * migrated: users land on their first organization once, then it sticks.
 */
export const expoActiveOrgStorage = createActiveOrgPersistence({
  read: () => mmkv.getString(DEFAULT_ORG_STORAGE_KEY),
  write: (value) => mmkv.set(DEFAULT_ORG_STORAGE_KEY, value),
  remove: () => mmkv.remove(DEFAULT_ORG_STORAGE_KEY),
});

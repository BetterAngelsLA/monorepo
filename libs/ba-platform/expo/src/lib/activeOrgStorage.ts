import {
  ACTIVE_ORG_STORAGE_KEY,
  type ActiveOrgPersistence,
} from '@monorepo/ba-platform';
import { createMMKV } from 'react-native-mmkv';

// Created lazily rather than at module scope so importing this file does not
// touch the native module — matching how userPreferencesState does it.
let store: ReturnType<typeof createMMKV> | undefined;
const mmkv = () => (store ??= createMMKV());

/**
 * MMKV-backed persistence for the active organization id.
 *
 * No instance id, so this lands in MMKV's default instance — the app-wide one,
 * and the documented home for global values. User preferences deliberately get
 * their own ``user:${userId}`` instance; this value cannot, because the request
 * that fetches the user is itself one that needs the header, so the id has to
 * be readable before there is a user id to scope by. Sign-out calls
 * ``clearActiveOrgId`` and the organization list reconciles it, which is what
 * keeps a shared device honest instead.
 *
 * Reaches MMKV directly rather than through the repo's other MMKV consumer,
 * ``createPersistentSynchronousStorage``, which is only exposed via a barrel
 * that the platform layer cannot import.
 *
 * Values previously written to ``AsyncStorage`` under this key are not
 * migrated: users land on their first organization once, then it sticks.
 */
export const expoActiveOrgStorage: ActiveOrgPersistence = {
  get: () => mmkv().getString(ACTIVE_ORG_STORAGE_KEY) ?? null,
  set: (value) =>
    value === null
      ? mmkv().remove(ACTIVE_ORG_STORAGE_KEY)
      : mmkv().set(ACTIVE_ORG_STORAGE_KEY, value),
};

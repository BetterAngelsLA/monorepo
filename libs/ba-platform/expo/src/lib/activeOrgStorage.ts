import {
  ACTIVE_ORG_STORAGE_KEY,
  createActiveOrgPersistence,
} from '@monorepo/ba-platform';
import { createMMKV } from 'react-native-mmkv';

// Created lazily rather than at module scope so importing this file does not
// touch the native module — matching how userPreferencesState does it.
let store: ReturnType<typeof createMMKV> | undefined;
const mmkv = () => (store ??= createMMKV());

/**
 * MMKV-backed persistence for the active organization id.
 *
 * MMKV rather than ``AsyncStorage`` because this value is read during render
 * and on every request, neither of which can await.
 *
 * No instance id, which puts the id in MMKV's default instance — the app-wide
 * one, and the documented home for global values. User preferences
 * deliberately get their own ``user:${userId}`` instance; this value cannot,
 * because the request that fetches the user is itself one that needs the
 * header, so the id has to be readable before there is a user id to scope by.
 * Sign-out calls ``clearActiveOrgId`` and the organization list reconciles it,
 * which is what keeps a shared device honest instead.
 *
 * Reaches MMKV directly rather than through
 * ``createPersistentSynchronousStorage``. That wrapper is the repo's other
 * MMKV consumer and would be the better home for this, but it is only exposed
 * through ``@monorepo/expo/shared/utils`` — a barrel that also re-exports the
 * file, image and dev-menu helpers, so importing it here fails on missing
 * React Native globals and would drag that whole surface into the platform
 * layer. Moving it to its own entry point would let both consumers share it.
 *
 * Values previously written to ``AsyncStorage`` under this key are not
 * migrated: users land on their first organization once, then it sticks.
 */
export const expoActiveOrgStorage = createActiveOrgPersistence({
  read: () => mmkv().getString(ACTIVE_ORG_STORAGE_KEY),
  write: (value) => mmkv().set(ACTIVE_ORG_STORAGE_KEY, value),
  remove: () => mmkv().remove(ACTIVE_ORG_STORAGE_KEY),
});

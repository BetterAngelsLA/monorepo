import { atomFamily } from 'jotai-family';
import { atomWithStorage } from 'jotai/utils';
import { createPersistentSynchronousStorage } from '@monorepo/expo/shared/utils';
import { adaptToJotaiStorage } from '../../storage/createJotaiStorageFromStore';
import {
  userPreferencesDefaultState,
  userPreferencesStorageKey,
} from '../constants';
import { TUserPreferencesState } from '../types';

function createUserPreferencesStore(userId: string) {
  if (!userId) {
    throw new Error('[createUserStore] missing userId.');
  }

  return createPersistentSynchronousStorage({
    scopeId: `user:${userId}`,
  });
}

export const userPreferencesAtomFamily = atomFamily((userId: string) => {
  const userStore = createUserPreferencesStore(userId);
  const jotaiStorage = adaptToJotaiStorage<TUserPreferencesState>(userStore);

  return atomWithStorage<TUserPreferencesState>(
    userPreferencesStorageKey,
    userPreferencesDefaultState,
    jotaiStorage
  );
});

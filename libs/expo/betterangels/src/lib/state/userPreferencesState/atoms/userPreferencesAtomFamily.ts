import { atomFamily } from 'jotai-family';
import { atomWithStorage } from 'jotai/utils';
import { adaptToJotaiStorage } from '../../storage/createJotaiStorageFromStore';
import { createPersistentSynchronousStorage } from '../../storage/createPersistentSynchronousStorage';
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

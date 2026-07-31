import { TUserPreferencesState } from './types';

export const userPreferencesStorageKey = 'user_preferences';

export const userPreferencesDefaultState: TUserPreferencesState = {
  teamId: null,
  location: null,
};

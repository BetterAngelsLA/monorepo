import { TUserPreferencesState } from './types';

export const userPreferencesStorageKey = 'user_preferences';

export const userPreferencesDefaultState: TUserPreferencesState = {
  team: null,
  location: null,
};

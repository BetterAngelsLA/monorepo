import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { userPreferencesAtomFamily } from './userPreferencesAtomFamily';

export const userPreferencesTeamAtomFamily = atomFamily((userId: string) => {
  const preferencesAtom = userPreferencesAtomFamily(userId);

  return atom(
    (get) => {
      return get(preferencesAtom).teamId;
    },
    (_get, set, nextTeamId: string | null) => {
      set(preferencesAtom, (prev) => ({
        ...prev,
        teamId: nextTeamId,
      }));
    }
  );
});

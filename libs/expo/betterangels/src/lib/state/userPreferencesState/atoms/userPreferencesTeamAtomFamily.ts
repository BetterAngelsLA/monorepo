import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { SelahTeamEnum } from '../../../apollo';
import { userPreferencesAtomFamily } from './userPreferencesAtomFamily';

export const userPreferencesTeamAtomFamily = atomFamily((userId: string) => {
  const preferencesAtom = userPreferencesAtomFamily(userId);

  return atom(
    (get) => {
      return get(preferencesAtom).team;
    },
    (_get, set, nextTeam: SelahTeamEnum | null) => {
      set(preferencesAtom, (prev) => ({
        ...prev,
        team: nextTeam,
      }));
    }
  );
});

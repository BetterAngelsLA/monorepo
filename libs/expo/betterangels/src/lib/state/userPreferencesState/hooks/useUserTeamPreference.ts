import { useAtom } from 'jotai';
import { useUser } from '../../../hooks';
import { userPreferencesTeamAtomFamily } from '../atoms/userPreferencesTeamAtomFamily';

export function useUserTeamPreference() {
  const { user } = useUser();

  if (!user) {
    throw new Error('[useUserTeamPreference] user missing.');
  }

  return useAtom(userPreferencesTeamAtomFamily(user.id));
}

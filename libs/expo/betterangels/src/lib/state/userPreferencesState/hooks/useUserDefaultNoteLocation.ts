import { useAtom } from 'jotai';
import useUser from '../../../hooks/user/useUser';
import { userPreferencesLocationAtomFamily } from '../atoms/userPreferencesLocationAtomFamily';

export function useUserDefaultNoteLocation() {
  const { user } = useUser();

  if (!user) {
    throw new Error('[useUserDefaultNoteLocation] user missing.');
  }

  return useAtom(userPreferencesLocationAtomFamily(user.id));
}

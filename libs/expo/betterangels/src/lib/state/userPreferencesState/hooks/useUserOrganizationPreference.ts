import { useAtom } from 'jotai';
import useUser from '../../../hooks/user/useUser';
import { userPreferencesOrganizationAtomFamily } from '../atoms/userPreferencesOrganizationAtomFamily';

export function useUserOrganizationPreference() {
  const { user } = useUser();

  if (!user) {
    throw new Error('[useUserOrganizationPreference] user missing.');
  }

  return useAtom(userPreferencesOrganizationAtomFamily(user.id));
}

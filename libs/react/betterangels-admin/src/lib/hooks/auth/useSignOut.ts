import { useSignOut as useSharedSignOut } from '@monorepo/react/shared';
import { useUser } from '../../providers';

export default function useSignOut() {
  const { setUser } = useUser();
  return useSharedSignOut(setUser);
}

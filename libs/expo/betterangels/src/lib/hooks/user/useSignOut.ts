import { router } from 'expo-router';
import useStore from '../useStore';
import useUser from './useUser';

export default function useSignOut() {
  const { deleteStore } = useStore();
  const { setUser } = useUser();
  async function signOut() {
    await deleteStore('sessionid');
    setUser(undefined);
    router.replace('/auth');
  }

  return { signOut };
}

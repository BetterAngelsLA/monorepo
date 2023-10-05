import { ReactNode, useEffect, useMemo, useState } from 'react';

import { useStore } from '../../hooks';
import UserContext, { TUser } from './UserContext';

interface UserProviderProps {
  children: ReactNode;
}

function useProtectedRoute() {
  const [user, setUser] = useState<TUser | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { getStore } = useStore();

  useEffect(() => {
    async function getUserAndNavigate() {
      try {
        const sessionId = await getStore('sessionid');
        setUser({ id: sessionId });
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    }

    getUserAndNavigate();
  }, []);

  return { user, setUser, isLoading };
}

export default function UserProvider({ children }: UserProviderProps) {
  const { isLoading, user, setUser } = useProtectedRoute();

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
    }),
    [user, isLoading, setUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

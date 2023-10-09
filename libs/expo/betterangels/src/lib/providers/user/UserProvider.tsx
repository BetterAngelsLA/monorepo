import { ReactNode, useEffect, useMemo, useState } from 'react';

import { fetchUser } from '../../helpers';
import UserContext, { TUser } from './UserContext';

interface UserProviderProps {
  children: ReactNode;
}

function useProtectedRoute() {
  const [user, setUser] = useState<TUser | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getUserAndNavigate() {
      try {
        const user = await fetchUser();
        console.log('fetched user: ', user);
        setUser(user);
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

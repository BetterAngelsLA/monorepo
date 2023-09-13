import { ReactNode, useEffect, useMemo, useState } from 'react';

import UserContext, { TUser } from './UserContext';

interface UserProviderProps {
  children: ReactNode;
}

function useProtectedRoute() {
  const [user, setUser] = useState<TUser | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getUserAndNavigate() {
      const currentUser = user;

      // if (storedUser) {
      //   currentUser = JSON.parse(storedUser);
      //   setUser(currentUser);
      // }

      setIsLoading(false);
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
    [user, isLoading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

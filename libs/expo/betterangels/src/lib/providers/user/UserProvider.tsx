import { ReactNode, useEffect, useMemo, useState } from 'react';

import { useQuery } from '@apollo/client';
import { GET_CURRENT_USER } from '../../helpers/fetchUser';
import UserContext, { TUser } from './UserContext';

interface UserProviderProps {
  children: ReactNode;
}

function useProtectedRoute() {
  const [user, setUser] = useState<TUser | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { data, loading, error } = useQuery(GET_CURRENT_USER);

  useEffect(() => {
    if (data && data.user) {
      setUser({
        id: data.currentUser.id,
        email: data.currentUser.email,
        username: data.currentUser.name,
        hasOrganization: false,
      });
    }

    setIsLoading(loading);

    if (error) {
      console.error(error);
    }
  }, [data, loading, error]);

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

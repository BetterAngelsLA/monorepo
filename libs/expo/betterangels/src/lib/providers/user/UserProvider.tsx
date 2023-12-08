import { gql, useLazyQuery } from '@apollo/client';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import UserContext, { TUser } from './UserContext';

const GET_CURRENT_USER = gql`
  query currentUser {
    currentUser {
      id
      username
      email
    }
  }
`;

interface UserProviderProps {
  children: ReactNode;
}

export default function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<TUser | undefined>();
  const [fetchUser, { data, loading: isLoading, error }] = useLazyQuery(
    GET_CURRENT_USER,
    {
      fetchPolicy: 'network-only',
    }
  );

  const refetchUser = useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (data && data.currentUser) {
      setUser(data.currentUser);
    }
  }, [data]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      error,
      refetchUser,
    }),
    [user, isLoading, error, refetchUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

import { gql, useQuery } from '@apollo/client';
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
  const {
    data,
    loading: isLoading,
    refetch: originalRefetch,
  } = useQuery(GET_CURRENT_USER, {
    fetchPolicy: 'network-only',
  });

  const refetchUser = useCallback(async () => {
    try {
      const response = await originalRefetch();
      if (response.data) {
        setUser(response.data.currentUser);
      }
    } catch (error) {
      console.error('Error refetching user data:', error);
    }
  }, [originalRefetch]);

  useEffect(() => {
    if (data && !isLoading) {
      setUser(data.currentUser);
    }
  }, [data, isLoading]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      refetchUser,
    }),
    [user, isLoading, setUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

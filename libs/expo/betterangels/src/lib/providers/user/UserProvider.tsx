import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import UserContext, { TUser } from './UserContext';
import { useCurrentUserQuery } from './__generated__/UserProvider.generated';

interface UserProviderProps {
  children: ReactNode;
}

export default function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<TUser | undefined>();
  const {
    data,
    loading: isLoading,
    refetch,
  } = useCurrentUserQuery({
    fetchPolicy: 'network-only',
  });

  const refetchUser = useCallback(async () => {
    try {
      const response = await refetch();
      if (response.data && response.data.currentUser) {
        const {
          id,
          username,
          firstName,
          lastName,
          email,
          organizations,
          isOutreachAuthorized,
        } = response.data.currentUser;
        setUser({
          id,
          username,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          email,
          organizations: organizations || null,
          isOutreachAuthorized: isOutreachAuthorized || false,
        });
      }
    } catch (err) {
      console.error('Error refetching user data:', err);
    }
  }, [refetch]);

  useEffect(() => {
    if (data && !isLoading) {
      const {
        id,
        username,
        firstName,
        lastName,
        email,
        organizations,
        isOutreachAuthorized,
      } = data.currentUser;
      setUser({
        id,
        username,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email,
        organizations: organizations || null,
        isOutreachAuthorized: isOutreachAuthorized || false,
      });
    }
  }, [data, isLoading]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      refetchUser,
    }),
    [user, isLoading, refetchUser, setUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

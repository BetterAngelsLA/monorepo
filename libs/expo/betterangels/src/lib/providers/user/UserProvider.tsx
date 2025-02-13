import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import UserContext, { TUser } from './UserContext';
import {
  CurrentUserQuery,
  useCurrentUserQuery,
} from './__generated__/UserProvider.generated';

interface UserProviderProps {
  children: ReactNode;
}

const parseUser = (user?: CurrentUserQuery['currentUser']): TUser | undefined =>
  user
    ? {
        id: user.id,
        username: user.username,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        email: user.email,
        organizations: user.organizations ?? null,
        isOutreachAuthorized: user.isOutreachAuthorized ?? false,
        hasAcceptedTos: user.hasAcceptedTos ?? false,
        hasAcceptedPrivacyPolicy: user.hasAcceptedPrivacyPolicy ?? false,
      }
    : undefined;

type UserResponse = {
  data?: CurrentUserQuery;
  errors?: readonly { message: string }[];
};

export default function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<TUser | undefined>();

  const { data, loading, error, refetch } = useCurrentUserQuery({
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const updateUser = useCallback((res: UserResponse) => {
    if (res.errors?.some((e) => e.message.includes('User is not logged in.'))) {
      setUser(undefined);
    } else {
      setUser(parseUser(res.data?.currentUser));
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      updateUser({ data, errors: error ? [error] : undefined });
    }
  }, [loading, data, error, updateUser]);

  const refetchUser = useCallback(async () => {
    try {
      const res = await refetch();
      updateUser(res);
    } catch (err) {
      console.error('Error refetching user data:', err);
      setUser(undefined);
    }
  }, [refetch, updateUser]);

  const contextValue = useMemo(
    () => ({ user, setUser, isLoading: loading, refetchUser }),
    [user, loading, refetchUser]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

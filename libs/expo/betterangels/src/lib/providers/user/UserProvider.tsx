import { API_ERROR_CODES } from '@monorepo/expo/shared/clients';
import { GraphQLFormattedError } from 'graphql';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useAppState } from '../../hooks';
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
  errors?: readonly GraphQLFormattedError[];
};

export default function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<TUser | undefined>();

  const { appBecameActive } = useAppState();
  const { data, loading, error, refetch } = useCurrentUserQuery({
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const updateUser = useCallback((res: UserResponse) => {
    const invalidate = res.errors?.some((e) => {
      return e.extensions?.['code'] === API_ERROR_CODES.UNAUTHENTICATED;
    });

    const userValue = invalidate ? undefined : parseUser(res.data?.currentUser);

    setUser(userValue);
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

  useEffect(() => {
    if (appBecameActive) {
      refetchUser();
    }
  }, [appBecameActive, refetchUser]);

  const contextValue = useMemo(
    () => ({ user, setUser, isLoading: loading, refetchUser }),
    [user, loading, refetchUser]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

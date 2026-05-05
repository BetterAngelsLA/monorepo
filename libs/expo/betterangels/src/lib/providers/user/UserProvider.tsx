import { useQuery } from '@apollo/client/react';
import { API_ERROR_CODES } from '@monorepo/expo/shared/clients';
import { GraphQLFormattedError } from 'graphql';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useAppState } from '../../hooks';
import UserContext, { TUser } from './UserContext';
import {
  CurrentUserDocument,
  CurrentUserQuery,
} from './__generated__/UserProvider.generated';

interface UserProviderProps {
  children: ReactNode;
}

const parseUser = (user?: CurrentUserQuery['currentUser']): TUser | undefined =>
  user
    ? {
        id: user.id,
        username: user.username ?? undefined,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        email: user.email,
        organizations: user.organizations ?? null,
        isOutreachAuthorized: user.isOutreachAuthorized ?? false,
        hasAcceptedTos: user.hasAcceptedTos ?? false,
        hasAcceptedPrivacyPolicy: user.hasAcceptedPrivacyPolicy ?? false,
        isHmisUser: user.isHmisUser ?? undefined,
      }
    : undefined;

type UserResponse = {
  data?: CurrentUserQuery;
  errors?: readonly GraphQLFormattedError[];
};

export default function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<TUser | undefined>();
  const [isSettled, setIsSettled] = useState(false);

  const { appBecameActive } = useAppState();
  const { data, loading, error, refetch } = useQuery(CurrentUserDocument, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const updateUser = useCallback((res: UserResponse) => {
    const invalidate = res.errors?.some((e) => {
      return e.extensions?.['code'] === API_ERROR_CODES.UNAUTHENTICATED;
    });

    const userValue = invalidate ? undefined : parseUser(res.data?.currentUser);

    // Batch both updates: React 18 flushes them in the same render,
    // eliminating the flash of unauthorized-root between loading=false and user being set.
    setUser(userValue);
    setIsSettled(true);
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
      setUser(undefined);
    }
  }, [refetch, updateUser]);

  useEffect(() => {
    if (!appBecameActive) {
      return;
    }

    // Refetch user data when app becomes active
    // The server will handle session validation and return null user if expired
    refetchUser();
  }, [appBecameActive, refetchUser]);

  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      isLoading: loading,
      refetchUser,
      isHmisUser: user?.isHmisUser,
    }),
    [user, loading, refetchUser]
  );

  return (
    <UserContext.Provider value={contextValue}>
      <View
        testID={
          !isSettled
            ? 'authorized-pending'
            : user
            ? 'authorized-root'
            : 'unauthorized-root'
        }
        style={{ flex: 1 }}
      >
        {children}
      </View>
    </UserContext.Provider>
  );
}

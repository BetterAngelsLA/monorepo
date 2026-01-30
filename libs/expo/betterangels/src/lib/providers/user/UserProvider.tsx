import { useLazyQuery } from '@apollo/client/react';
import { API_ERROR_CODES, getSessionManager } from '@monorepo/expo/shared/clients';
import { GraphQLFormattedError } from 'graphql';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useAppState } from '../../hooks';
import { handleSessionExpired } from '../../auth';
import useSnackbar from '../../hooks/snackbar/useSnackbar';
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
  const { showSnackbar } = useSnackbar();

  const { appBecameActive } = useAppState();
  const [executeQuery, { loading }] = useLazyQuery(CurrentUserDocument, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  // Set up session monitoring callback when user is logged in
  useEffect(() => {
    const manager = getSessionManager();
    if (!manager) return;

    if (user) {
      const onExpired = () => handleSessionExpired(showSnackbar);
      manager.setCallback(onExpired);
    } else {
      manager.setCallback(null);
    }
  }, [user, showSnackbar]);

  const updateUser = useCallback((res: UserResponse) => {
    const invalidate = res.errors?.some((e) => {
      return e.extensions?.['code'] === API_ERROR_CODES.UNAUTHENTICATED;
    });

    const userValue = invalidate ? undefined : parseUser(res.data?.currentUser);

    setUser(userValue);
  }, []);

  const refetchUser = useCallback(async () => {
    try {
      const res = await executeQuery();
      updateUser(res);
    } catch (err) {
      setUser(undefined);
    }
  }, [executeQuery, updateUser]);

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
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

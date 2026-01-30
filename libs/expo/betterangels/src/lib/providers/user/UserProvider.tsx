import { useLazyQuery } from '@apollo/client/react';
import { API_ERROR_CODES, SessionManager } from '@monorepo/expo/shared/clients';
import { USER_STORAGE_KEY } from '@monorepo/expo/shared/utils';
import { GraphQLFormattedError } from 'graphql';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../../hooks';
import { clearSession, handleSessionExpired } from '../../auth';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const { showSnackbar } = useSnackbar();

  const { appBecameActive } = useAppState();
  const [executeQuery, { loading }] = useLazyQuery(CurrentUserDocument, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (error) {
        console.debug(
          '[UserProvider] Failed to load user from storage:',
          error
        );
      } finally {
        setIsInitialized(true);
      }
    };
    loadUser();
  }, []);

  // Persist user to storage (except HMIS users - they're session-only)
  useEffect(() => {
    if (!isInitialized) return;

    const saveUser = async () => {
      try {
        if (user && !user.isHmisUser) {
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch (error) {
        console.debug('[UserProvider] Failed to save user to storage:', error);
      }
    };
    saveUser();
  }, [user, isInitialized]);

  // Set up session monitoring callback when user is logged in
  useEffect(() => {
    const manager = SessionManager.getInstance();
    if (!manager) return;

    if (user) {
      const onExpired = () => handleSessionExpired(showSnackbar, setUser);
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
      // Clear session on refetch error (likely auth issue)
      await clearSession(setUser);
    }
  }, [executeQuery, updateUser]);

  useEffect(() => {
    if (!appBecameActive) return;
    refetchUser();
  }, [appBecameActive, refetchUser]);

  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      isLoading: !isInitialized || loading,
      refetchUser,
      isHmisUser: user?.isHmisUser,
    }),
    [user, isInitialized, loading, refetchUser]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

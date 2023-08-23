import { router, useRootNavigationState, useSegments } from 'expo-router';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';

import UserContext, { TUser } from './UserContext';

interface UserProviderProps {
  children: ReactNode;
}

function useProtectedRoute(user: TUser | undefined) {
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, segments, navigationState]);
}

export default function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<TUser | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useProtectedRoute(user);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      setIsLoading,
    }),
    [user, isLoading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

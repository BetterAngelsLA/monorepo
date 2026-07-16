import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
import { createUserProvider } from '@monorepo/ba-platform';
import { asyncStorageAdapter } from '@monorepo/expo/shared/utils';
import { API_ERROR_CODES } from '@monorepo/expo/shared/clients';
import { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import useAppState from '../../hooks/appState/useAppState';
import {
  CurrentUserDocument,
  CurrentUserQuery,
} from './__generated__/UserProvider.generated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  organizations: { id: string; name: string; permissions: readonly PermissionEnum[] }[];
  isOutreachAuthorized?: boolean;
  hasAcceptedTos?: boolean;
  hasAcceptedPrivacyPolicy?: boolean;
  isHmisUser?: boolean;
};

// ---------------------------------------------------------------------------
// Base provider (Apollo + ActiveOrg + context)
// ---------------------------------------------------------------------------

const { UserProvider: BaseUserProvider, useUser } = createUserProvider({
  document: CurrentUserDocument,
  defaultStorage: asyncStorageAdapter,
  parseUser: (
    data: unknown
  ): TUser | undefined => {
    const userData = data as CurrentUserQuery['currentUser'] | undefined;
    return userData
      ? {
          id: userData.id,
          username: userData.username ?? undefined,
          firstName: userData.firstName ?? undefined,
          lastName: userData.lastName ?? undefined,
          email: userData.email,
          organizations: (userData.organizations ?? []).map((org) => ({
            id: org.id,
            name: org.name,
            permissions: (org.permissions ?? []) as PermissionEnum[],
          })),
          isOutreachAuthorized: userData.isOutreachAuthorized ?? false,
          hasAcceptedTos: userData.hasAcceptedTos ?? false,
          hasAcceptedPrivacyPolicy: userData.hasAcceptedPrivacyPolicy ?? false,
          isHmisUser: userData.isHmisUser ?? undefined,
        }
      : undefined;
  },
  isUnauthenticated: (errors) =>
    errors?.some(
      (e) => e.extensions?.['code'] === API_ERROR_CODES.UNAUTHENTICATED
    ) ?? false,
});

// ---------------------------------------------------------------------------
// Expo shell — RN-specific UI + app-state refetch
// ---------------------------------------------------------------------------

interface ExpoShellProps {
  children: ReactNode;
}

function ExpoShell({ children }: ExpoShellProps) {
  const { user, isLoading, refetchUser } = useUser();
  const { appBecameActive } = useAppState();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!isLoading) setSettled(true);
  }, [isLoading]);

  useEffect(() => {
    if (appBecameActive) refetchUser();
  }, [appBecameActive, refetchUser]);

  return (
    <View
      testID={
        !settled
          ? 'authorized-pending'
          : user
          ? 'authorized-root'
          : 'unauthorized-root'
      }
      style={{ flex: 1 }}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export default function UserProvider({ children }: { children: ReactNode }) {
  return (
    <BaseUserProvider>
      <ExpoShell>{children}</ExpoShell>
    </BaseUserProvider>
  );
}

export { useUser };

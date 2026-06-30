import { createUserProvider } from '@monorepo/ba-platform';
import { API_ERROR_CODES } from '@monorepo/expo/shared/clients';
import { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAppState } from '../../hooks';
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
  organizations: { id: string; name: string; permissions: string[] }[];
  isOutreachAuthorized?: boolean;
  hasAcceptedTos?: boolean;
  hasAcceptedPrivacyPolicy?: boolean;
  isHmisUser?: boolean;
};

// ---------------------------------------------------------------------------
// Base provider (Apollo + ActiveOrg + context)
// ---------------------------------------------------------------------------

const {
  UserProvider: BaseUserProvider,
  useUser,
} = createUserProvider({
  document: CurrentUserDocument,
  parseUser: (
    data: CurrentUserQuery['currentUser'] | undefined
  ): TUser | undefined =>
    data
      ? {
          id: data.id,
          username: data.username ?? undefined,
          firstName: data.firstName ?? undefined,
          lastName: data.lastName ?? undefined,
          email: data.email,
          organizations: (data.organizations ?? []).map((org) => ({
            id: org.id,
            name: org.name,
            permissions: org.permissions ?? [],
          })),
          isOutreachAuthorized: data.isOutreachAuthorized ?? false,
          hasAcceptedTos: data.hasAcceptedTos ?? false,
          hasAcceptedPrivacyPolicy: data.hasAcceptedPrivacyPolicy ?? false,
          isHmisUser: data.isHmisUser ?? undefined,
        }
      : undefined,
  isUnauthenticated: (errors) =>
    errors?.some(
      (e) => e.extensions?.['code'] === API_ERROR_CODES.UNAUTHENTICATED
    ) ?? false,
  extraContextValue: (user) => ({ isHmisUser: user?.isHmisUser }),
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

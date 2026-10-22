import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
import {
  createUserProvider,
  useActiveOrg,
  useApiConfig,
} from '@monorepo/ba-platform';
import { API_ERROR_CODES } from '@monorepo/expo/shared/clients';
import { ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import useAppState from '../../hooks/appState/useAppState';
import { useReferralDraftSession } from '../../draft/useReferralDraftSession';
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
  organizations: {
    id: string;
    name: string;
    permissions: readonly PermissionEnum[];
  }[];
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
  parseUser: (data: unknown, prev?: TUser): TUser | undefined => {
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
          // Accepting the agreements is monotonic *for the lifetime of this
          // provider*. The accept is written as soon as the server confirms it,
          // but this query is re-run on foreground, so a read that was already
          // in flight can resolve afterwards still carrying the pre-accept
          // payload; applying that verbatim re-opens the consent sheet.
          //
          // Deliberate trade-off: because the latch is `prev || payload`, a
          // payload can never turn an accepted flag back off. A same-session
          // revocation would only be picked up on the next fresh read (a reload
          // or a new session). Nothing in the product revokes acceptance today;
          // if that changes, this needs a read-version guard instead of a
          // latch.
          hasAcceptedTos:
            prev?.hasAcceptedTos || (userData.hasAcceptedTos ?? false),
          hasAcceptedPrivacyPolicy:
            prev?.hasAcceptedPrivacyPolicy ||
            (userData.hasAcceptedPrivacyPolicy ?? false),
          isHmisUser: userData.isHmisUser ?? undefined,
        }
      : undefined;
  },
  isUnauthenticated: (errors) =>
    errors?.some(
      (e) => e.extensions?.['code'] === API_ERROR_CODES.UNAUTHENTICATED,
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
  const { apiUrl } = useApiConfig();
  const { activeOrg } = useActiveOrg();
  useReferralDraftSession({
    apiUrl,
    userId: user?.id,
    organizationId: activeOrg?.id,
  });
  const { appBecameActive } = useAppState();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!isLoading) setSettled(true);
  }, [isLoading]);

  useEffect(() => {
    if (appBecameActive) refetchUser();
  }, [appBecameActive, refetchUser]);

  return (
    // `app-root` is mounted as soon as the bundle has rendered, before the
    // auth query settles. E2E flows wait for it so they never inspect auth
    // state while the dev client is still on its native splash.
    <View testID="app-root" style={{ flex: 1 }}>
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

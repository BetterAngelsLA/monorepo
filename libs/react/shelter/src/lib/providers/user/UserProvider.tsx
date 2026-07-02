import { createUserProvider } from '@monorepo/ba-platform';
import {
  CurrentOrgUserDocument,
  type CurrentOrgUserQuery,
} from '@monorepo/ba-platform';
import { localStorageAdapter } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import type { TUser } from './UserContext';

const { UserProvider: BaseUserProvider, useUser } = createUserProvider({
  document: CurrentOrgUserDocument,
  parseUser: (
    data
  ): TUser | undefined => {
    const user = data as CurrentOrgUserQuery['currentUser'] | undefined;
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      email: user.email,
      organization: user.organizations?.[0] ?? undefined,
      organizations: user.organizations ?? null,
    };
  },
  isUnauthenticated: (errors) =>
    errors?.some((e) => e.message.includes('User is not logged in.')) ?? false,
});

/**
 * Web UserProvider — defaults ``storage`` to :const:`localStorageAdapter`.
 */
function UserProvider({ children }: { children: ReactNode }) {
  return <BaseUserProvider storage={localStorageAdapter}>{children}</BaseUserProvider>;
}

export { UserProvider, useUser };

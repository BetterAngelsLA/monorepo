import { localStorageAdapter } from '@monorepo/react/shared';
import React, { ReactNode } from 'react';
import { createUserProvider } from './createUserProvider';
import {
  CurrentOrgUserDocument,
  type CurrentOrgUserQuery,
} from '../../../apollo';

// ---------------------------------------------------------------------------
// Standard user type for admin / dashboard apps
// ---------------------------------------------------------------------------

export type CurrentUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  organizations: readonly {
    id: string;
    name: string;
    permissions: readonly string[];
  }[] | null;
};

// ---------------------------------------------------------------------------
// Pre-configured provider for the standard CurrentOrgUser query
// ---------------------------------------------------------------------------

const { UserProvider: BaseUserProvider, useUser } = createUserProvider({
  document: CurrentOrgUserDocument,
  parseUser: (data): CurrentUser | undefined => {
    const user = data as CurrentOrgUserQuery['currentUser'] | undefined;
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      email: user.email ?? undefined,
      organizations: user.organizations ?? [],
    };
  },
  isUnauthenticated: (errors) =>
    errors?.some((e) => e.message.includes('User is not logged in.')) ?? false,
});

/**
 * Web UserProvider — defaults ``storage`` to :const:`localStorageAdapter`.
 */
function UserProvider({ children }: { children: ReactNode }) {
  return React.createElement(BaseUserProvider, { storage: localStorageAdapter, children });
}

export { UserProvider, useUser };

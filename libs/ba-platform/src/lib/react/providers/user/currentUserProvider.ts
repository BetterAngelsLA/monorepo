import { isPermission } from '@monorepo/ba-platform/permissions';
import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
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
  /** The user's GLOBAL permission list (ADR 0001, finding F24). */
  permissions?: readonly PermissionEnum[];
  organizations:
    | readonly {
        id: string;
        name: string;
        permissions: readonly PermissionEnum[];
      }[]
    | null;
};

// ---------------------------------------------------------------------------
// Pre-configured provider for the standard CurrentOrgUser query
// ---------------------------------------------------------------------------

const { UserProvider, useUser } = createUserProvider({
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
      // Backend permission strings are ``app.codename``; keep only the ones the
      // frontend actually models (PermissionEnum), so a backend perm-name this
      // app does not know can never be stored as a gateable permission.
      permissions: user.permissions?.filter(isPermission),
      organizations: (user.organizations ?? []).map((org) => ({
        ...org,
        permissions: org.permissions.filter(isPermission),
      })) as CurrentUser['organizations'],
    };
  },
  isUnauthenticated: (errors) =>
    errors?.some((e) => e.message.includes('User is not logged in.')) ?? false,
});

export { UserProvider, useUser };

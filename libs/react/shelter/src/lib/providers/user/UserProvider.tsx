import {
  createUserProvider,
  CurrentOrgUserDocument,
  type CurrentOrgUserQuery,
} from '@monorepo/ba-platform';
import { isPermission } from '@monorepo/ba-platform/permissions';
import type { TUser } from './UserContext';

const { UserProvider, useUser } = createUserProvider({
  document: CurrentOrgUserDocument,
  parseUser: (data): TUser | undefined => {
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
      // Backend permission strings are ``app.codename``; keep only the ones
      // the frontend models (PermissionEnum), as ba-platform's
      // currentUserProvider does, so an unknown backend permission can never
      // be gated on.
      permissions: user.permissions.filter(isPermission),
    };
  },
  isUnauthenticated: (errors) =>
    errors?.some((e) => e.message.includes('User is not logged in.')) ?? false,
});

export { UserProvider, useUser };

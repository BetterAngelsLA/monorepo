import { createUserProvider } from './createUserProvider';
import {
  CurrentOrgUserDocument,
  type CurrentOrgUserQuery,
} from '../../apollo';

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

export const { UserProvider, useUser } = createUserProvider({
  document: CurrentOrgUserDocument,
  parseUser: (
    data: CurrentOrgUserQuery['currentUser'] | undefined
  ): CurrentUser | undefined => {
    if (!data) return undefined;
    return {
      id: data.id,
      username: data.username ?? undefined,
      firstName: data.firstName ?? undefined,
      lastName: data.lastName ?? undefined,
      email: data.email,
      organizations: data.organizations ?? [],
    };
  },
  isUnauthenticated: (errors) =>
    errors?.some((e) => e.message.includes('User is not logged in.')) ?? false,
});

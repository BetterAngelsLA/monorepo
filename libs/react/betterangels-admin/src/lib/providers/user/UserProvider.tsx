import {
  createUserProvider,
  CurrentOrgUserDocument,
  CurrentOrgUserQuery,
} from '@monorepo/ba-platform';
import type { TUser } from './UserContext';

const { UserProvider, useUser } = createUserProvider({
  document: CurrentOrgUserDocument,
  parseUser: (data: CurrentOrgUserQuery['currentUser'] | undefined): TUser | undefined => {
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

export { UserProvider, useUser };

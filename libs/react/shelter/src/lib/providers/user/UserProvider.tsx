import { useQuery } from '@apollo/client/react';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { UserOrganizationPermissions } from '../../apollo/graphql/__generated__/types';
import UserContext, { TUser } from './UserContext';
import {
  CurrentOrgUserDocument,
  CurrentOrgUserQuery,
} from './__generated__/UserProvider.generated';

interface UserProviderProps {
  children: ReactNode;
}

const parseUser = (
  user?: CurrentOrgUserQuery['currentUser']
): TUser | undefined => {
  if (!user) {
    return undefined;
  }
  const userOrganization = user.organizations?.[0];
  if (!userOrganization) {
    return undefined;
  }

  const userPermissions = userOrganization.userPermissions ?? [];
  const permissionMap: Record<UserOrganizationPermissions, string> = {
    [UserOrganizationPermissions.AccessOrgPortal]: 'canAccessOrgPortal',
    [UserOrganizationPermissions.AddOrgMember]: 'canAddOrgMember',
    [UserOrganizationPermissions.ChangeOrgMemberRole]: 'canChangeOrgMemberRole',
    [UserOrganizationPermissions.RemoveOrgMember]: 'canRemoveOrgMember',
    [UserOrganizationPermissions.ViewOrgMembers]: 'canViewOrgMembers',
  };

  const permFlags = Object.fromEntries(
    Object.entries(permissionMap).map(([perm, key]) => [
      key,
      userPermissions.includes(perm as UserOrganizationPermissions),
    ])
  );

  return {
    id: user.id,
    organization: userOrganization,
    username: user.username ?? undefined,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    email: user.email,
    organizations: user.organizations ?? null,
    ...permFlags,
  };
};

type UserResponse = {
  data?: CurrentOrgUserQuery;
  errors?: readonly { message: string }[];
};

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<TUser | undefined>();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  const { data, loading, error, refetch } = useQuery(CurrentOrgUserDocument, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const updateUser = useCallback((res: UserResponse) => {
    if (res.errors?.some((e) => e.message.includes('User is not logged in.'))) {
      setUser(undefined);
    } else {
      setUser(parseUser(res.data?.currentUser));
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      updateUser({ data, errors: error ? [error] : undefined });
      setIsInitialLoading(false);
    }
  }, [loading, data, error, updateUser]);

  const refetchUser = useCallback(async () => {
    setIsRefetching(true);
    try {
      const res = await refetch();
      updateUser(res);
    } catch (err) {
      console.error('Error refetching user data:', err);
      setUser(undefined);
    } finally {
      setIsRefetching(false);
    }
  }, [refetch, updateUser]);

  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      isLoading: isInitialLoading || isRefetching,
      refetchUser,
    }),
    [user, isInitialLoading, isRefetching, refetchUser]
  );

  // Only block rendering on initial load, not on refetch
  if (isInitialLoading) {
    return null;
  }

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

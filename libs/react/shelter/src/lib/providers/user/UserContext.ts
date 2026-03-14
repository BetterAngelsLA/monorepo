import { TOrganization } from '@monorepo/react/shared';
import { createContext, Dispatch, SetStateAction } from 'react';
import { UserOrganizationPermissions } from '../../apollo/graphql/__generated__/types';

export type { TOrganization };

export type TOrganizationWithPermissions = TOrganization & {
  userPermissions?: UserOrganizationPermissions[] | null;
};

export type TUser = {
  id: string;
  organization?: TOrganizationWithPermissions;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  organizations: TOrganizationWithPermissions[] | null;
  canAccessOrgPortal?: boolean;
  canAddOrgMember?: boolean;
  canChangeOrgMemberRole?: boolean;
  canRemoveOrgMember?: boolean;
  canViewOrgMembers?: boolean;
};

export interface IUserProviderValue {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<IUserProviderValue | undefined>(undefined);

export default UserContext;

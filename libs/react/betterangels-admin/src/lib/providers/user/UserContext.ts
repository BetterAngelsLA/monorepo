import { createContext, Dispatch, SetStateAction } from 'react';

export type TOrganization = {
  id: string;
  name: string;
};

export type TUser = {
  id: string;
  organization?: TOrganization;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  organizations: TOrganization[] | null;
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

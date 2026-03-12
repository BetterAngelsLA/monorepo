import { createContext, Dispatch, SetStateAction } from 'react';
import { TOrganizationWithPermissions } from '../activeOrg';

export type TUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  /** All orgs the user belongs to, each carrying that org's permissions. */
  organizations: TOrganizationWithPermissions[] | null;
};

export interface IUserProviderValue {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<IUserProviderValue | undefined>(undefined);

export default UserContext;

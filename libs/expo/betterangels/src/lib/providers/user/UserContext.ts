import { createContext, Dispatch, SetStateAction } from 'react';

export type TOrganization = {
  id: string;
  name: string;
};

export type TUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  organizations: TOrganization[] | null;
  isOutreachAuthorized: boolean;
};

export interface IUserProviderValue {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<IUserProviderValue | undefined>(undefined);

export default UserContext;

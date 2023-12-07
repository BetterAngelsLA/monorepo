import { createContext, Dispatch, SetStateAction } from 'react';

export type TUser = {
  id: string;
  username?: string;
  email?: string;
  hasOrganization: boolean;
};

export interface IUserProviderValue {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
}

const UserContext = createContext<IUserProviderValue | undefined>(undefined);

export default UserContext;

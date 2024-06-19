import { createContext, Dispatch, SetStateAction } from 'react';

export type TUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  organizations: string[] | null;
};

export interface IUserProviderValue {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<IUserProviderValue | undefined>(undefined);

export default UserContext;

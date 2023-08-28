import { createContext, Dispatch, SetStateAction } from 'react';

export type TUser = {
  id: string;
};

export interface IUserProviderValue {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

const UserContext = createContext<IUserProviderValue | undefined>(undefined);

export default UserContext;

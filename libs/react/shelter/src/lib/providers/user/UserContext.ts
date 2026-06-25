import { createContext, Dispatch, SetStateAction } from 'react';
import { CurrentOrgUserQuery } from '@monorepo/ba-platform';

type OrganizationsArray = NonNullable<
  CurrentOrgUserQuery['currentUser']['organizations']
>;
export type TOrganization = OrganizationsArray[number];

export type TUser = {
  id: string;
  organization?: TOrganization;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  organizations: TOrganization[] | null;
};

export interface IUserProviderValue {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
  refetchUser: () => Promise<TUser | undefined>;
}

const UserContext = createContext<IUserProviderValue | undefined>(undefined);

export default UserContext;

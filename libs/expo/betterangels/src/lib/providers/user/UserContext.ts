import { TOrganization } from '@monorepo/react/shared';
import { createContext, Dispatch, SetStateAction } from 'react';
import { UserOrganizationPermissions } from '../../apollo/graphql/__generated__/types';

export type { TOrganization };

export type TOrganizationWithPermissions = TOrganization & {
  userPermissions?: UserOrganizationPermissions[] | null;
};

export type TUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  organizations: TOrganizationWithPermissions[] | null;
  hasAcceptedTos?: boolean;
  hasAcceptedPrivacyPolicy?: boolean;
  isHmisUser?: boolean;
};

export interface IUserProviderValue {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
  isHmisUser: boolean | undefined;
}

const UserContext = createContext<IUserProviderValue | undefined>(undefined);

export default UserContext;

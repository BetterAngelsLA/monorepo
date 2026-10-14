import type { CurrentOrgUserQuery } from '@monorepo/ba-platform';
import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
import type { Dispatch, SetStateAction } from 'react';

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
  /** The user's GLOBAL permission list (ADR 0001, finding F24). */
  permissions: PermissionEnum[];
};

export interface IUserProviderValue {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

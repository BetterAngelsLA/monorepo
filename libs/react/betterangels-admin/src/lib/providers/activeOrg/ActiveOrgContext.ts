import { createContext } from 'react';
import { CurrentOrgUserQuery } from '../user/__generated__/UserProvider.generated';
import { PermissionEnum } from './hasPermission';

type OrganizationsArray = NonNullable<
  CurrentOrgUserQuery['currentUser']['organizations']
>;
export type TOrganizationWithPermissions = OrganizationsArray[number];

export interface IActiveOrgContextValue {
  /** The currently selected organization (with its capabilities). */
  activeOrg: TOrganizationWithPermissions | undefined;
  /** All organizations the user has access to. */
  organizations: TOrganizationWithPermissions[];
  /** Switch to a different org by its id. */
  setActiveOrgId: (orgId: string) => void;
  /** Check if the active org has a specific permission. */
  hasPermission: (permission: PermissionEnum) => boolean;
}

const ActiveOrgContext = createContext<IActiveOrgContextValue | undefined>(
  undefined
);

export default ActiveOrgContext;

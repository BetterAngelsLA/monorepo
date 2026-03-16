import { TOrganizationWithPermissions } from '@monorepo/react/shelter';
import { createContext } from 'react';
import { UserOrganizationPermissions } from '../../apollo/graphql/__generated__/types';

export interface IActiveOrgContextValue {
  /** The currently selected organization (with its permissions). */
  activeOrg: TOrganizationWithPermissions | undefined;
  /** All organizations the user has access to. */
  organizations: TOrganizationWithPermissions[];
  /** Switch to a different org by its id. */
  setActiveOrgId: (orgId: string) => void;
  /**
   * Check whether the current user holds `perm` on the **active** org.
   *
   * Permissions update automatically when the user switches orgs.
   */
  hasPermission: (perm: UserOrganizationPermissions) => boolean;
}

const ActiveOrgContext = createContext<IActiveOrgContextValue | undefined>(
  undefined
);

export default ActiveOrgContext;

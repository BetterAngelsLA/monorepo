import { createContext } from 'react';
import { UserOrganizationPermissions } from '../../apollo/graphql/__generated__/types';

/**
 * An organization enriched with the current user's permissions on it.
 * The `userPermissions` array comes straight from the GraphQL
 * `CurrentUserOrganizationType.userPermissions` field.
 */
export type TOrganizationWithPermissions = {
  id: string;
  name: string;
  userPermissions?: UserOrganizationPermissions[] | null;
};

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
   * Because the check is driven by the `UserOrganizationPermissions`
   * enum (which is code-generated from the backend), adding a new
   * permission on the backend requires zero manual frontend changes
   * beyond re-running codegen.
   */
  hasPermission: (perm: UserOrganizationPermissions) => boolean;
}

const ActiveOrgContext = createContext<IActiveOrgContextValue | undefined>(
  undefined
);

export default ActiveOrgContext;

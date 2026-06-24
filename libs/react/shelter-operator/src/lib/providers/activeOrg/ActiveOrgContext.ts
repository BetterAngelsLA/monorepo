import { TOrganization } from '@monorepo/react/shelter';
import { createContext } from 'react';
import {
  ReportPermissions,
  ShelterPermissions,
  UserOrganizationPermissions,
} from '../../apollo/graphql/__generated__/types';

export type PermissionEnum =
  | UserOrganizationPermissions
  | ReportPermissions
  | ShelterPermissions;

export interface IActiveOrgContextValue {
  /** The currently selected organization (with its capabilities). */
  activeOrg: TOrganization | undefined;
  /** All organizations the user has access to. */
  organizations: TOrganization[];
  /** Switch to a different org by its id. */
  setActiveOrgId: (orgId: string) => void;
  /** Check if the active org has a specific permission. */
  can: (permission: PermissionEnum) => boolean;
}

const ActiveOrgContext = createContext<IActiveOrgContextValue | undefined>(
  undefined
);

export default ActiveOrgContext;

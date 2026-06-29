import type { PermissionEnum } from '@monorepo/ba-permissions';
import { TOrganization } from '@monorepo/react/shelter';
import { createContext } from 'react';

export type { PermissionEnum } from '@monorepo/ba-permissions';

export interface IActiveOrgContextValue {
  /** The currently selected organization (with its capabilities). */
  activeOrg: TOrganization | undefined;
  /** All organizations the user has access to. */
  organizations: TOrganization[];
  /** Switch to a different org by its id. */
  setActiveOrgId: (orgId: string) => void;
  /** Check if the active org has a specific permission. */
  hasPermission: (permission: PermissionEnum) => boolean;
}

const ActiveOrgContext = createContext<IActiveOrgContextValue | undefined>(
  undefined
);

export default ActiveOrgContext;

import { TOrganization } from '@monorepo/react/shelter';
import { createContext } from 'react';

export interface IActiveOrgContextValue {
  /** The currently selected organization (with its capabilities). */
  activeOrg: TOrganization | undefined;
  /** All organizations the user has access to. */
  organizations: TOrganization[];
  /** Switch to a different org by its id. */
  setActiveOrgId: (orgId: string) => void;
}

const ActiveOrgContext = createContext<IActiveOrgContextValue | undefined>(
  undefined
);

export default ActiveOrgContext;

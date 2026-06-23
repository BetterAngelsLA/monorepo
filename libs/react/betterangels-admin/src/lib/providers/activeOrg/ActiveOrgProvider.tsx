import { ACTIVE_ORG_STORAGE_KEY } from '@monorepo/apollo';
import { useActiveOrgState } from '@monorepo/react/shared';
import { ReactNode, useCallback, useMemo } from 'react';
import ActiveOrgContext, {
  TOrganizationWithPermissions,
} from './ActiveOrgContext';
import {
  hasPermission as hasPermissionFn,
  PermissionEnum,
} from './hasPermission';

interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: TOrganizationWithPermissions[];
}

/**
 * Provides the currently-selected organization **and its permissions**
 * to the component tree.
 *
 * Defaults to the first org in the list but persists the user's choice
 * in ``localStorage`` so it survives page reloads.
 */
export function ActiveOrgProvider({
  children,
  organizations,
}: ActiveOrgProviderProps) {
  const { activeOrg, setActiveOrgId } = useActiveOrgState({
    organizations,
    storageKey: ACTIVE_ORG_STORAGE_KEY,
  });

  const hasPermission = useCallback(
    (perm: PermissionEnum): boolean => hasPermissionFn(activeOrg, perm),
    [activeOrg]
  );

  const value = useMemo(
    () => ({ activeOrg, organizations, setActiveOrgId, hasPermission }),
    [activeOrg, organizations, setActiveOrgId, hasPermission]
  );

  return (
    <ActiveOrgContext.Provider value={value}>
      {children}
    </ActiveOrgContext.Provider>
  );
}

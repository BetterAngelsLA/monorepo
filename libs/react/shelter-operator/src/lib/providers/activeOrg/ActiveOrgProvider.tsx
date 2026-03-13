import { TOrganizationWithPermissions } from '@monorepo/react/shelter';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { UserOrganizationPermissions } from '../../apollo/graphql/__generated__/types';
import ActiveOrgContext from './ActiveOrgContext';

const STORAGE_KEY = 'shelter_operator_active_org_id';

interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: TOrganizationWithPermissions[];
}

export function ActiveOrgProvider({
  children,
  organizations,
}: ActiveOrgProviderProps) {
  const [activeOrgId, setActiveOrgIdState] = useState<string | undefined>(
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && organizations.some((o) => o.id === stored)) {
          return stored;
        }
      } catch {
        // localStorage may be unavailable
      }
      return organizations[0]?.id;
    }
  );

  // Re-validate when the organizations list changes (e.g. after async load)
  useEffect(() => {
    if (activeOrgId && organizations.some((o) => o.id === activeOrgId)) {
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && organizations.some((o) => o.id === stored)) {
        setActiveOrgIdState(stored);
        return;
      }
    } catch {
      // localStorage may be unavailable
    }
    setActiveOrgIdState(organizations[0]?.id);
  }, [organizations]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeOrg = useMemo(
    () => organizations.find((o) => o.id === activeOrgId) ?? organizations[0],
    [organizations, activeOrgId]
  );

  const setActiveOrgId = useCallback(
    (orgId: string) => {
      if (organizations.some((o) => o.id === orgId)) {
        setActiveOrgIdState(orgId);
        try {
          localStorage.setItem(STORAGE_KEY, orgId);
        } catch {
          // localStorage may be unavailable
        }
      }
    },
    [organizations]
  );

  const hasPermission = useCallback(
    (perm: UserOrganizationPermissions): boolean =>
      activeOrg?.userPermissions?.includes(perm) ?? false,
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

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import ActiveOrgContext, {
  TOrganizationWithPermissions,
} from './ActiveOrgContext';

const STORAGE_KEY = 'betterangels_active_org_id';

interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: TOrganizationWithPermissions[];
}

/**
 * Provides the currently-selected organization **and its capabilities**
 * to the component tree.
 *
 * Defaults to the first org in the list but persists the user's choice
 * in `localStorage` so it survives page reloads.
 */
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
      } catch (err) {
        console.error('Failed to read localStorage:', err);
      }
      return organizations[0]?.id;
    }
  );

  // Re-validate when the organizations list changes (e.g. after async load)
  useEffect(() => {
    if (activeOrgId && organizations.some((o) => o.id === activeOrgId)) {
      return; // current selection is still valid
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && organizations.some((o) => o.id === stored)) {
        setActiveOrgIdState(stored);
        return;
      }
    } catch (err) {
      console.error('Failed to read localStorage:', err);
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
        } catch (err) {
          console.error('Failed to write localStorage:', err);
        }
      }
    },
    [organizations]
  );

  const value = useMemo(
    () => ({ activeOrg, organizations, setActiveOrgId }),
    [activeOrg, organizations, setActiveOrgId]
  );

  return (
    <ActiveOrgContext.Provider value={value}>
      {children}
    </ActiveOrgContext.Provider>
  );
}

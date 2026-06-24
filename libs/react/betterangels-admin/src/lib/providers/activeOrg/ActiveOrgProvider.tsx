import { localStorageAdapter, type StorageAdapter } from '@monorepo/react/shared';
import { filter, isArray, pipe, some, values } from 'remeda';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import ActiveOrgContext, {
  PermissionEnum,
  TOrganizationWithPermissions,
} from './ActiveOrgContext';

const DEFAULT_STORAGE_KEY = 'betterangels_active_org_id';

interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: TOrganizationWithPermissions[];
  /** Storage adapter — defaults to :const:`localStorageAdapter`. */
  storage?: StorageAdapter;
  /** Storage key — defaults to ``'betterangels_active_org_id'``. */
  storageKey?: string;
}

/**
 * Provides the currently-selected organization **and its permissions**
 * to the component tree.
 *
 * Defaults to the first org in the list but persists the user's choice
 * in the configured storage so it survives page reloads.
 *
 * ``hasPermission(perm)`` checks the active org's permissions
 * and automatically reflects the correct org when the user
 * switches.  Because the check is enum-driven there is nothing to
 * update here when the backend adds new permissions — just re-run
 * codegen.
 */
export function ActiveOrgProvider({
  children,
  organizations,
  storage = localStorageAdapter,
  storageKey = DEFAULT_STORAGE_KEY,
}: ActiveOrgProviderProps) {
  const [activeOrgId, setActiveOrgIdState] = useState<string | undefined>(
    () => {
      try {
        const stored = storage.getItem(storageKey) as string | null;
        if (stored && organizations.some((o) => o.id === stored)) {
          return stored;
        }
      } catch (err) {
        console.error('Failed to read storage:', err);
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
      const stored = storage.getItem(storageKey) as string | null;
      if (stored && organizations.some((o) => o.id === stored)) {
        setActiveOrgIdState(stored);
        return;
      }
    } catch (err) {
      console.error('Failed to read storage:', err);
    }
    setActiveOrgIdState(organizations[0]?.id);
    if (organizations[0]?.id) {
      try {
        storage.setItem(storageKey, organizations[0].id);
      } catch (err) {
        console.error('Failed to persist org id:', err);
      }
    }
  }, [organizations, storage, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeOrg = useMemo(
    () => organizations.find((o) => o.id === activeOrgId) ?? organizations[0],
    [organizations, activeOrgId]
  );

  const setActiveOrgId = useCallback(
    (orgId: string) => {
      if (organizations.some((o) => o.id === orgId)) {
        setActiveOrgIdState(orgId);
        try {
          storage.setItem(storageKey, orgId);
        } catch (err) {
          console.error('Failed to write storage:', err);
        }
      }
    },
    [organizations, storage, storageKey]
  );

  const can = useCallback(
    (permission: PermissionEnum): boolean =>
      activeOrg?.permissions != null &&
      pipe(activeOrg.permissions, values(), filter(isArray), some((arr) => (arr as string[]).includes(permission))),
    [activeOrg]
  );

  const value = useMemo(
    () => ({ activeOrg, organizations, setActiveOrgId, can }),
    [activeOrg, organizations, setActiveOrgId, can]
  );

  return (
    <ActiveOrgContext.Provider value={value}>
      {children}
    </ActiveOrgContext.Provider>
  );
}

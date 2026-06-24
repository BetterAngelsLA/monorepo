import { localStorageAdapter, type StorageAdapter } from '@monorepo/react/shared';
import { TOrganization } from '@monorepo/react/shelter';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { pipe, values, flat, isIncludedIn } from 'remeda';
import ActiveOrgContext, { PermissionEnum } from './ActiveOrgContext';

const DEFAULT_STORAGE_KEY = 'betterangels_active_org_id';

interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: TOrganization[];
  /** Storage adapter — defaults to :const:`localStorageAdapter`. */
  storage?: StorageAdapter;
  /** Storage key — defaults to ``'betterangels_active_org_id'``. */
  storageKey?: string;
}

/**
 * Provides the currently-selected organization **and its permissions**
 * to the component tree.
 *
 * TODO: Merge with betterangels-admin's ActiveOrgProvider into a shared
 * BA-specific lib (along with orgLink) when one is created.
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
      } catch {
        // storage may be unavailable
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
      const stored = storage.getItem(storageKey) as string | null;
      if (stored && organizations.some((o) => o.id === stored)) {
        setActiveOrgIdState(stored);
        return;
      }
    } catch {
      // storage may be unavailable
    }
    setActiveOrgIdState(organizations[0]?.id);
    if (organizations[0]?.id) {
      try {
        storage.setItem(storageKey, organizations[0].id);
      } catch {
        // storage may be unavailable
      }
    }
    // Intentionally omitting activeOrgId from deps to avoid a re-validation
    // loop: this effect only needs to run when the organizations list changes
    // (e.g. after the user query loads), not on every activeOrgId update.
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
        } catch {
          // storage may be unavailable
        }
      }
    },
    [organizations, storage, storageKey]
  );

  const can = useCallback(
    (permission: PermissionEnum): boolean =>
      activeOrg?.permissions != null &&
      pipe(
        activeOrg.permissions,
        values(),
        flat(),
        isIncludedIn(permission)
      ),
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

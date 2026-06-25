import { useActiveOrgState } from '@monorepo/ba-platform';
import { localStorageAdapter, type StorageAdapter } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import ActiveOrgContext, {
  TOrganizationWithPermissions,
} from './ActiveOrgContext';

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
 * Delegates state management to ``useActiveOrgState`` from ``@monorepo/ba-platform``
 * and wraps it in this app's ``ActiveOrgContext``.
 */
export function ActiveOrgProvider({
  children,
  organizations,
  storage = localStorageAdapter,
  storageKey,
}: ActiveOrgProviderProps) {
  const value = useActiveOrgState(organizations, { storage, storageKey });

  return (
    <ActiveOrgContext.Provider value={value}>
      {children}
    </ActiveOrgContext.Provider>
  );
}

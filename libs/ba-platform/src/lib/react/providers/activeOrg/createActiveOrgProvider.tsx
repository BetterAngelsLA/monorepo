import { ReactNode } from 'react';
import { localStorageAdapter, type StorageAdapter } from '@monorepo/react/shared';
import { useActiveOrgState, type ActiveOrgState, type Org } from './useActiveOrgState';

interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: Org[];
  /** Storage adapter — defaults to :const:`localStorageAdapter`. */
  storage?: StorageAdapter;
  /** Storage key — defaults to ``'betterangels_active_org_id'``. */
  storageKey?: string;
}

/**
 * Create an ``ActiveOrgProvider`` component bound to a specific React context.
 */
export function createActiveOrgProvider(OrgContext: React.Context<ActiveOrgState | undefined>) {
  return function ActiveOrgProvider({
    children,
    organizations,
    storage = localStorageAdapter,
    storageKey,
  }: ActiveOrgProviderProps) {
    const value = useActiveOrgState(organizations, { storage, storageKey });

    return (
      <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
    );
  };
}

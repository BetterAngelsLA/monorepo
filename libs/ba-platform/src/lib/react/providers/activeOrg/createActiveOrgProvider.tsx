import { ReactNode } from 'react';
import { type StorageAdapter } from '@monorepo/react/shared';
import { useActiveOrgState, type ActiveOrgState, type Org } from './useActiveOrgState';

export interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: Org[];
  /** Storage adapter (e.g. :const:`localStorageAdapter` for web, :const:`asyncStorageAdapter` for Expo). */
  storage: StorageAdapter;
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
    storage,
    storageKey,
  }: ActiveOrgProviderProps) {
    const value = useActiveOrgState(organizations, { storage, storageKey });

    return (
      <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
    );
  };
}

import { ReactNode } from 'react';
import { localStorageAdapter, type StorageAdapter } from '@monorepo/react/shared';
import { useActiveOrgState, type ActiveOrgState, type BaseOrg } from './useActiveOrgState';

interface ActiveOrgProviderProps<TOrg extends BaseOrg> {
  children: ReactNode;
  organizations: TOrg[];
  /** Storage adapter — defaults to :const:`localStorageAdapter`. */
  storage?: StorageAdapter;
  /** Storage key — defaults to ``'betterangels_active_org_id'``. */
  storageKey?: string;
}

/**
 * Create an ``ActiveOrgProvider`` component bound to a specific
 * React context.
 *
 * Both ``betterangels-admin`` and ``shelter-operator`` use this
 * factory with their own ``ActiveOrgContext`` to produce a
 * type-safe provider that delegates to the shared
 * ``useActiveOrgState`` hook.
 *
 * @param OrgContext  A React context whose value type is
 *   ``ActiveOrgState<TOrg> | undefined``.
 */
export function createActiveOrgProvider<TOrg extends BaseOrg>(OrgContext: React.Context<ActiveOrgState<TOrg> | undefined>) {
  return function ActiveOrgProvider({
    children,
    organizations,
    storage = localStorageAdapter,
    storageKey,
  }: ActiveOrgProviderProps<TOrg>) {
    const value = useActiveOrgState(organizations, { storage, storageKey });

    return (
      <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
    );
  };
}

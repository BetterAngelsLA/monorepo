import { ReactNode } from 'react';
import { useActiveOrgState, type ActiveOrgState, type Org } from './useActiveOrgState';

export interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: Org[];
}

/**
 * Create an ``ActiveOrgProvider`` component bound to a specific React context.
 *
 * Takes no storage adapter: the active organization id is held in the
 * module-level store (``@monorepo/ba-platform`` → ``activeOrg``), whose
 * synchronous backing each app installs once at bootstrap via
 * ``configureActiveOrgStorage``. That is what lets the fetch interceptor read
 * the id without an await, and it is why this provider no longer threads a
 * storage adapter down from the app.
 */
export function createActiveOrgProvider(OrgContext: React.Context<ActiveOrgState | undefined>) {
  return function ActiveOrgProvider({ children, organizations }: ActiveOrgProviderProps) {
    const value = useActiveOrgState(organizations);

    return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
  };
}

import { ReactNode } from 'react';
import { useActiveOrgState, type ActiveOrgState, type Org } from './useActiveOrgState';

export interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: Org[];
}

/** Create an ``ActiveOrgProvider`` bound to a specific React context. */
export function createActiveOrgProvider(OrgContext: React.Context<ActiveOrgState | undefined>) {
  return function ActiveOrgProvider({ children, organizations }: ActiveOrgProviderProps) {
    const value = useActiveOrgState(organizations);

    return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
  };
}

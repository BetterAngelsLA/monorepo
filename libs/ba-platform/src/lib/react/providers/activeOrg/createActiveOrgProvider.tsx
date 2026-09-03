import { ReactNode } from 'react';
import {
  useActiveOrgState,
  type ActiveOrgState,
  type Org,
} from './useActiveOrgState';

export interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: Org[];
  /**
   * The user's GLOBAL permission list (ADR 0001, finding F24) — raw backend
   * ``app.codename`` strings; ``useActiveOrgState`` filters them to the modeled
   * set before they become gateable.
   */
  globalPermissions?: readonly string[];
}

/** Create an ``ActiveOrgProvider`` bound to a specific React context. */
export function createActiveOrgProvider(
  OrgContext: React.Context<ActiveOrgState | undefined>,
) {
  return function ActiveOrgProvider({
    children,
    organizations,
    globalPermissions,
  }: ActiveOrgProviderProps) {
    const value = useActiveOrgState(organizations, globalPermissions);

    return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
  };
}

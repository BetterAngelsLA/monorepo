import { ReactNode } from 'react';
import {
  useActiveOrgState,
  type ActiveOrgState,
  type Org,
} from './useActiveOrgState';

export interface ActiveOrgProviderProps {
  children: ReactNode;
  /**
   * The user's organizations, or `undefined` while they are not known yet.
   * Unknown is not the same as empty: with `undefined` the store keeps the
   * remembered organization in play rather than treating the user as belonging
   * to nothing.
   */
  organizations: Org[] | undefined;
}

/** Create an ``ActiveOrgProvider`` bound to a specific React context. */
export function createActiveOrgProvider(
  OrgContext: React.Context<ActiveOrgState | undefined>,
) {
  return function ActiveOrgProvider({
    children,
    organizations,
  }: ActiveOrgProviderProps) {
    const value = useActiveOrgState(organizations);

    return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
  };
}

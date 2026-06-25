import { createContext, Context, useContext } from 'react';
import { type ActiveOrgState, type BaseOrg } from './useActiveOrgState';

/**
 * Create a React context typed for a specific organization type.
 *
 * Usage in each app:
 *
 * .. code-block:: ts
 *
 *    const ActiveOrgContext = createActiveOrgContext<TOrganization>();
 *    export default ActiveOrgContext;
 */
export function createActiveOrgContext<TOrg extends BaseOrg>() {
  return createContext<ActiveOrgState<TOrg> | undefined>(undefined);
}

/**
 * Create a ``useActiveOrg`` hook bound to a specific React context.
 *
 * Usage in each app:
 *
 * .. code-block:: ts
 *
 *    export const useActiveOrg = createUseActiveOrg(ActiveOrgContext);
 */
export function createUseActiveOrg<TOrg extends BaseOrg>(OrgContext: Context<ActiveOrgState<TOrg> | undefined>) {
  return function useActiveOrg(): ActiveOrgState<TOrg> {
    const context = useContext(OrgContext);
    if (!context) {
      throw new Error('useActiveOrg must be used within an ActiveOrgProvider');
    }
    return context;
  };
}

import { createContext, Context, useContext } from 'react';
import { type ActiveOrgState } from './useActiveOrgState';

/** Create a React context for the active org state. */
export function createActiveOrgContext() {
  return createContext<ActiveOrgState | undefined>(undefined);
}

/** Create a ``useActiveOrg`` hook bound to a specific React context. */
export function createUseActiveOrg(OrgContext: Context<ActiveOrgState | undefined>) {
  return function useActiveOrg(): ActiveOrgState {
    const context = useContext(OrgContext);
    if (!context) {
      throw new Error('useActiveOrg must be used within an ActiveOrgProvider');
    }
    return context;
  };
}

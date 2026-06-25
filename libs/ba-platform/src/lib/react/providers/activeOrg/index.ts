import { createActiveOrgContext } from './createActiveOrgContext';
import { createActiveOrgProvider } from './createActiveOrgProvider';
import { createUseActiveOrg } from './createActiveOrgContext';
import { type BaseOrg } from './useActiveOrgState';

// Pre-instantiated context, provider, and hook for the common org shape.
// Apps with richer org types (e.g. TOrganizationWithPermissions) can still
// pass them to ActiveOrgProvider — TypeScript structural typing handles it.
const ActiveOrgContext = createActiveOrgContext<BaseOrg>();
const useActiveOrg = createUseActiveOrg<BaseOrg>(ActiveOrgContext);
const ActiveOrgProvider = createActiveOrgProvider<BaseOrg>(ActiveOrgContext);

export { ActiveOrgContext, ActiveOrgProvider, useActiveOrg };
export type { BaseOrg };
export { createActiveOrgContext, createUseActiveOrg } from './createActiveOrgContext';
export { createActiveOrgProvider } from './createActiveOrgProvider';
export { useActiveOrgState } from './useActiveOrgState';
export type { ActiveOrgState } from './useActiveOrgState';

import { createActiveOrgContext, createUseActiveOrg } from './createActiveOrg';
import { createActiveOrgProvider } from './createActiveOrgProvider';

const ActiveOrgContext = createActiveOrgContext();
const useActiveOrg = createUseActiveOrg(ActiveOrgContext);
const ActiveOrgProvider = createActiveOrgProvider(ActiveOrgContext);

export { createActiveOrgContext, createUseActiveOrg } from './createActiveOrg';
export { createActiveOrgProvider } from './createActiveOrgProvider';
export { useActiveOrgState } from './useActiveOrgState';
export type { ActiveOrgState, Org } from './useActiveOrgState';
export { ActiveOrgContext, ActiveOrgProvider, useActiveOrg };

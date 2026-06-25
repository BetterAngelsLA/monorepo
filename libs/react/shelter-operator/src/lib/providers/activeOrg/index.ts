import { createActiveOrgProvider } from '@monorepo/ba-platform';
import { TOrganization } from '@monorepo/react/shelter';
import ActiveOrgContext from './ActiveOrgContext';

export { useActiveOrg } from './useActiveOrg';

export const ActiveOrgProvider =
  createActiveOrgProvider<TOrganization>(ActiveOrgContext);

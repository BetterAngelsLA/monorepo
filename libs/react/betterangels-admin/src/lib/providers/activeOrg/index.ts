import { createActiveOrgProvider } from '@monorepo/ba-platform';
import ActiveOrgContext, { type TOrganizationWithPermissions } from './ActiveOrgContext';

export type {
  PermissionEnum,
  TOrganizationWithPermissions,
} from './ActiveOrgContext';
export { useActiveOrg } from './useActiveOrg';

export const ActiveOrgProvider =
  createActiveOrgProvider<TOrganizationWithPermissions>(ActiveOrgContext);

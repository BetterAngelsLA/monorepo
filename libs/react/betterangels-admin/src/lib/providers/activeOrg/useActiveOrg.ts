import { createUseActiveOrg } from '@monorepo/ba-platform';
import { type TOrganizationWithPermissions } from './ActiveOrgContext';
import ActiveOrgContext from './ActiveOrgContext';

export const useActiveOrg =
  createUseActiveOrg<TOrganizationWithPermissions>(ActiveOrgContext);

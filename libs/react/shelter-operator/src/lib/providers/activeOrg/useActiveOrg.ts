import { createUseActiveOrg } from '@monorepo/ba-platform';
import { TOrganization } from '@monorepo/react/shelter';
import ActiveOrgContext from './ActiveOrgContext';

export const useActiveOrg =
  createUseActiveOrg<TOrganization>(ActiveOrgContext);

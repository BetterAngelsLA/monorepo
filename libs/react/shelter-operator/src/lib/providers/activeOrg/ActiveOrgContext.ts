import { TOrganization } from '@monorepo/react/shelter';
import { createActiveOrgContext } from '@monorepo/ba-platform';
import {
  ReportPermissions,
  ShelterPermissions,
  UserOrganizationPermissions,
} from '../../apollo/graphql/__generated__/types';

export type PermissionEnum =
  | UserOrganizationPermissions
  | ReportPermissions
  | ShelterPermissions;

const ActiveOrgContext = createActiveOrgContext<TOrganization>();

export default ActiveOrgContext;

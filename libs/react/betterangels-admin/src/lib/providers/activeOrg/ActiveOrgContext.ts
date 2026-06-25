import { createActiveOrgContext } from '@monorepo/ba-platform';
import { CurrentOrgUserQuery } from '../user/__generated__/UserProvider.generated';
import {
  ReportPermissions,
  ShelterPermissions,
  UserOrganizationPermissions,
} from '../../apollo/graphql/__generated__/types';

type OrganizationsArray = NonNullable<
  CurrentOrgUserQuery['currentUser']['organizations']
>;
export type TOrganizationWithPermissions = OrganizationsArray[number];

export type PermissionEnum =
  | UserOrganizationPermissions
  | ReportPermissions
  | ShelterPermissions;

const ActiveOrgContext =
  createActiveOrgContext<TOrganizationWithPermissions>();

export default ActiveOrgContext;

import { arrayIncludes } from '@monorepo/react/shared';
import {
  ReportPermissions,
  ShelterPermissions,
  UserOrganizationPermissions,
} from '../../apollo/graphql/__generated__/types';
import { TOrganizationWithPermissions } from './ActiveOrgContext';

export type PermissionEnum =
  | UserOrganizationPermissions
  | ReportPermissions
  | ShelterPermissions;

export function hasPermission(
  org: TOrganizationWithPermissions | undefined,
  permission: PermissionEnum
): boolean {
  return arrayIncludes(org?.permissions, permission);
}

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

let cachedOrg: TOrganizationWithPermissions | undefined;
let cachedSet: Set<string> | undefined;

function getGrantedSet(org: TOrganizationWithPermissions): Set<string> {
  if (cachedOrg === org && cachedSet) return cachedSet;
  const { __typename, ...domains } = org.permissions;
  cachedSet = new Set(Object.values(domains).flat());
  cachedOrg = org;
  return cachedSet;
}

export function hasPermission(
  org: TOrganizationWithPermissions | undefined,
  permission: PermissionEnum
): boolean {
  if (!org?.permissions) return false;
  return getGrantedSet(org).has(permission);
}

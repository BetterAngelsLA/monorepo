import {
  ReportPermissions,
  ShelterPermissions,
  UserOrganizationPermissions,
} from '../../apollo/graphql/__generated__/types';
import { TOrganizationWithPermissions } from './ActiveOrgContext';

// Team CRUD permissions — matches teams.permissions.TeamPermissions on the backend.
// TODO: regenerate types after schema export to pick up the strawberry enum.
export enum TeamPermissions {
  VIEW = 'teams.view_team',
  ADD = 'teams.add_team',
  CHANGE = 'teams.change_team',
  DELETE = 'teams.delete_team',
}

export type PermissionEnum =
  | UserOrganizationPermissions
  | ReportPermissions
  | ShelterPermissions
  | TeamPermissions;

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

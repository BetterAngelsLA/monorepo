import type { Dispatch, SetStateAction } from 'react';
import type { CurrentOrgUserQuery } from '@monorepo/ba-platform';

type OrganizationsArray = NonNullable<
  CurrentOrgUserQuery['currentUser']['organizations']
>;
export type TOrganization = OrganizationsArray[number];

export type TUser = {
  id: string;
  organization?: TOrganization;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  /** Global-tier capabilities (currentUser.permissions) — ADR 0001 §2.4. */
  permissions?: string[];
  organizations: TOrganization[] | null;
};

/**
 * Capability gate (ADR 0001 §5.2): a permission is held at the global tier
 * OR by the user's active (first) organization.  Mirrors the generic
 * useActiveOrgState.hasPermission contract so UI can gate features on
 * capabilities rather than role names.
 */
export function hasPermission(user: TUser | undefined, permission: string): boolean {
  if (!user) return false;
  if (user.permissions?.includes(permission)) return true;
  return user.organization?.permissions?.includes(permission) ?? false;
}

export interface IUserProviderValue {
  user: TUser | undefined;
  setUser: Dispatch<SetStateAction<TUser | undefined>>;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

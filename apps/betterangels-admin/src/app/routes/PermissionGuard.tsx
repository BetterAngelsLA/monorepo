import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
import { useActiveOrg } from '@monorepo/ba-platform';
import { Navigate } from 'react-router';

type IProps = {
  permission: PermissionEnum;
  children: React.ReactNode;
};

export function PermissionGuard({ permission, children }: IProps) {
  const { activeOrg, organizations, hasPermission } = useActiveOrg();

  // The active-org selection lands one commit after the org list, so
  // `activeOrg` is briefly undefined for a user who does have an org.
  // Redirecting then bounces a permitted user to `/` (React Router 7 made
  // that window observable); an org-less user still redirects.
  if (!activeOrg && organizations.length > 0) {
    return null;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

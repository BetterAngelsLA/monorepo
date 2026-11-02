import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
import { useActiveOrg } from '@monorepo/ba-platform';
import { Navigate } from 'react-router';

type IProps = {
  permission: PermissionEnum;
  children: React.ReactNode;
};

export function PermissionGuard({ permission, children }: IProps) {
  const { activeOrg, organizations, hasPermission } = useActiveOrg();

  // The store's active-org selection lands one commit after the org list:
  // ``activeOrg`` is undefined on the first render even when the user does
  // belong to an organization. Treating that as a denial redirects a permitted
  // user to ``/`` — React Router 7 made that window observable, where v6 had
  // rendered the children by then. Only the org-less case (no organizations at
  // all) keeps the redirect below, which is the behaviour it had before.
  if (!activeOrg && organizations.length > 0) {
    return null;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

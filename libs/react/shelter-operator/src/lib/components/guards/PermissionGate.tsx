import { useActiveOrg } from '@monorepo/ba-platform';
import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { shelterMgmtResourceRoute, type TMgmtResource } from '../../routing';

type PermissionGateProps = {
  permission: PermissionEnum;
  fallbackPath: string;
  children: ReactNode;
};

/** Renders *children* only when the active org holds *permission*; otherwise
 * redirects to *fallbackPath*. Used to gate dedicated create/edit routes. */
export function PermissionGate({
  permission,
  fallbackPath,
  children,
}: PermissionGateProps) {
  const { hasPermission } = useActiveOrg();

  if (!hasPermission(permission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

type MgmtActionGateProps = {
  resource: TMgmtResource;
  permission: PermissionEnum;
  children: ReactNode;
};

/** Permission gate for a shelter-management create/edit route; on denial it
 * falls back to that resource's list page under the current shelter. */
export function MgmtActionGate({
  resource,
  permission,
  children,
}: MgmtActionGateProps) {
  const { shelterId } = useParams<{ shelterId: string }>();
  const { hasPermission } = useActiveOrg();

  if (!hasPermission(permission)) {
    return <Navigate to={shelterMgmtResourceRoute(shelterId ?? '', resource)} replace />;
  }

  return <>{children}</>;
}

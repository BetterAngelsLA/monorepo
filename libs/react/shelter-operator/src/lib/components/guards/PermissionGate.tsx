import { useActiveOrg } from '@monorepo/ba-platform';
import type { PermissionEnum } from '@monorepo/ba-platform/permissions';
import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useBaPrivatePermissions } from '../../hooks';
import {
  profileRouteConfig,
  shelterMgmtResourceRoute,
  shelterProfileRoute,
  type TMgmtResource,
} from '../../routing';

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

  return (
    <PermissionGate
      permission={permission}
      fallbackPath={shelterMgmtResourceRoute(shelterId ?? '', resource)}
    >
      {children}
    </PermissionGate>
  );
}

type BaPrivateGateProps = {
  children: ReactNode;
};

/** Gate for the BA-private shelter-profile segment: admits the route when the
 * user can view ANY BA-private section. The area has a single GLOBAL-tier
 * section today, so this is effectively the contacts read gate — reads gated
 * on `can_globally(ContactInfo.VIEW)` (ADR 0001 §2.4) — and it reads the
 * user's global list via `useBaPrivatePermissions` instead of the org-scoped
 * `PermissionGate`, whose entry can carry the ContactInfo perms through a
 * scoped Grant that `can_globally` refuses (finding H2). A second section will
 * need its own in-section gate: this one admits anyone who can view *any*
 * section. On denial it falls back to the shelter's Basic Info segment. */
export function BaPrivateGate({ children }: BaPrivateGateProps) {
  const { canViewAny } = useBaPrivatePermissions();
  const { shelterId } = useParams<{ shelterId: string }>();

  if (!canViewAny) {
    return (
      <Navigate
        to={shelterProfileRoute(
          shelterId ?? '',
          profileRouteConfig.children.basic,
        )}
        replace
      />
    );
  }

  return <>{children}</>;
}

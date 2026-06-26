import type { PermissionEnum } from '@monorepo/ba-permissions';
import { useActiveOrg } from '@monorepo/ba-platform';
import { Navigate } from 'react-router-dom';

type IProps = {
  permission: PermissionEnum;
  children: React.ReactNode;
};

export function PermissionGuard({ permission, children }: IProps) {
  const { hasPermission } = useActiveOrg();

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

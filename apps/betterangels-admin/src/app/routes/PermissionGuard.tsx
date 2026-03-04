import {
  UserOrganizationPermissions,
  useActiveOrg,
} from '@monorepo/react/betterangels-admin';
import { Navigate } from 'react-router-dom';

type IProps = {
  permission: UserOrganizationPermissions;
  children: React.ReactNode;
};

export function PermissionGuard({ permission, children }: IProps) {
  const { hasPermission } = useActiveOrg();

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

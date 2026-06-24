import {
  PermissionEnum,
  useActiveOrg,
} from '@monorepo/react/betterangels-admin';
import { Navigate } from 'react-router-dom';

type IProps = {
  permission: PermissionEnum;
  children: React.ReactNode;
};

export function PermissionGuard({ permission, children }: IProps) {
  const { can } = useActiveOrg();

  if (!can(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

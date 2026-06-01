import {
  TOrganizationWithPermissions,
  useActiveOrg,
} from '@monorepo/react/betterangels-admin';
import { Navigate } from 'react-router-dom';

type IProps = {
  check: (org: TOrganizationWithPermissions) => boolean | undefined | null;
  children: React.ReactNode;
};

export function PermissionGuard({ check, children }: IProps) {
  const { activeOrg } = useActiveOrg();

  if (!activeOrg) {
    return null;
  }

  if (!check(activeOrg)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

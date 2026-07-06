import { useActiveOrg } from '@monorepo/ba-platform';
import {
  ReportPermissions,
  UserOrganizationPermissions,
  type PermissionEnum,
} from '@monorepo/ba-platform/permissions';
import { Navigate } from 'react-router-dom';

const permissionRoutes: { permission: PermissionEnum; path: string }[] = [
  { permission: UserOrganizationPermissions.ViewOrgMembers, path: '/users' },
  { permission: ReportPermissions.ViewReports, path: '/reports' },
];

export default function Home() {
  const { organizations, activeOrg, hasPermission } = useActiveOrg();

  if (organizations.length === 0 || !activeOrg) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  const firstAllowed = permissionRoutes.find((r) =>
    hasPermission(r.permission)
  );

  if (firstAllowed) return <Navigate to={firstAllowed.path} replace />;

  return (
    <div className="flex items-center justify-center h-full text-neutral-55">
      <p>You do not have access to any pages in this organization.</p>
    </div>
  );
}

import {
  UserOrganizationPermissions,
  useActiveOrg,
} from '@monorepo/react/betterangels-admin';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const permissionRoutes: {
  permission: UserOrganizationPermissions;
  path: string;
}[] = [
  {
    permission: UserOrganizationPermissions.ViewOrgMembers,
    path: '/users',
  },
  {
    permission: UserOrganizationPermissions.ViewReports,
    path: '/reports',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { hasPermission } = useActiveOrg();

  useEffect(() => {
    const firstAllowed = permissionRoutes.find((r) =>
      hasPermission(r.permission)
    );

    if (firstAllowed) {
      navigate(firstAllowed.path, { replace: true });
    }
  }, [navigate, hasPermission]);

  return (
    <div className="flex items-center justify-center h-full text-neutral-55">
      <p>You do not have access to any pages in this organization.</p>
    </div>
  );
}

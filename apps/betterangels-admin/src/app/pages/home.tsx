import {
  TOrganizationWithPermissions,
  useActiveOrg,
} from '@monorepo/react/betterangels-admin';
import { Navigate } from 'react-router-dom';

const capabilityRoutes: {
  check: (org: TOrganizationWithPermissions) => boolean | undefined | null;
  path: string;
}[] = [
  {
    check: (org) => org.capabilities?.accounts?.canViewMembers,
    path: '/users',
  },
  {
    check: (org) => org.capabilities?.reports?.canViewReports,
    path: '/reports',
  },
];

export default function Home() {
  const { organizations, activeOrg } = useActiveOrg();

  if (organizations.length === 0 || !activeOrg) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  const firstAllowed = capabilityRoutes.find((r) => r.check(activeOrg));

  if (firstAllowed) return <Navigate to={firstAllowed.path} replace />;

  return (
    <div className="flex items-center justify-center h-full text-neutral-55">
      <p>You do not have access to any pages in this organization.</p>
    </div>
  );
}

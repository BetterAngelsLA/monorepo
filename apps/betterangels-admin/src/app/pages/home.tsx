import { useMutation } from '@apollo/client/react';
import {
  PermissionEnum,
  ReportPermissions,
  useActiveOrg,
  useUser,
  UserOrganizationPermissions,
} from '@monorepo/react/betterangels-admin';
import { Button } from '@monorepo/react/components';
import { Input, toError } from '@monorepo/react/shared';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CreateOrganizationDocument } from '@monorepo/react/betterangels-admin';

const permissionRoutes: { permission: PermissionEnum; path: string }[] = [
  { permission: UserOrganizationPermissions.ViewOrgMembers, path: '/users' },
  { permission: ReportPermissions.ViewReports, path: '/reports' },
];

export default function Home() {
  const { organizations, activeOrg, hasPermission } = useActiveOrg();
  const { refetchUser } = useUser();
  const [orgName, setOrgName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createOrganization] = useMutation(CreateOrganizationDocument);

  // User has organizations — navigate to first allowed page
  if (organizations.length > 0 && activeOrg) {
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

  // User is authenticated but has no organization — show create form
  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      await createOrganization({
        variables: { data: { organizationName: orgName.trim() } },
      });
      await refetchUser();
    } catch (err) {
      setError(toError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold mb-2">Welcome to BetterAngels</h1>
        <p className="text-neutral-55 mb-6">
          Create your shelter organization to get started managing shelters,
          rooms, and beds.
        </p>

        <div className="mb-4">
          <Input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            disabled={submitting}
            type="text"
            inputClassname="input-md w-full"
            label="Organization Name"
            placeholder="Enter your organization name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateOrg();
            }}
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <Button
          size="2xl"
          variant="accent"
          onClick={handleCreateOrg}
          disabled={submitting || !orgName.trim()}
          className="w-full"
        >
          {submitting ? 'Creating...' : 'Create Organization'}
        </Button>
      </div>
    </div>
  );
}

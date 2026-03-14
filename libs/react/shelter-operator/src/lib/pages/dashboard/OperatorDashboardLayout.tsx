import { useUser } from '@monorepo/react/shelter';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from '../../components/NavBar';

export type OperatorDashboardLayoutContext = {
  organizations: Array<{ id: string; name: string }>;
  selectedOrganizationId: string;
  setSelectedOrganizationId: (organizationId: string) => void;
};

export default function OperatorDashboardLayout() {
  const { user } = useUser();
  const organizations = user?.organizations ?? [];
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    () => user?.organization?.id ?? ''
  );

  const orgId = user?.organization?.id;

  useEffect(() => {
    if (orgId && !selectedOrganizationId) {
      setSelectedOrganizationId(orgId);
    }
  }, [orgId, selectedOrganizationId]);

  return (
    <>
      <NavBar
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        onOrganizationChange={setSelectedOrganizationId}
      />
      <Outlet
        context={{
          organizations,
          selectedOrganizationId,
          setSelectedOrganizationId,
        }}
      />
    </>
  );
}

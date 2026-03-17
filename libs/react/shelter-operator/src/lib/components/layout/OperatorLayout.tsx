import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import { Plus, UserCog } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useActiveOrg } from '../../providers/activeOrg';
import { Button } from '../base-ui/buttons/buttons';
import { Dropdown } from '../base-ui/dropdown';
import { Text } from '../base-ui/text/text';

export function OperatorLayout() {
  const { pathname } = useLocation();
  const { activeOrg, organizations, setActiveOrgId } = useActiveOrg();
  const isOperatorRoute = pathname === '/operator';
  const isCreateShelterRoute = pathname === '/operator/dashboard/create';
  const selectedOrganizationId = activeOrg?.id ?? organizations[0]?.id ?? '';
  const title =
    organizations.length === 1 ? organizations[0].name : 'Admin Dashboard';

  const selectedOption =
    organizations
      .filter((org) => org.id === selectedOrganizationId)
      .map((org) => ({ label: org.name, value: org.id }))[0] ?? null;

  const orgOptions = organizations.map((org) => ({
    label: org.name,
    value: org.id,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <header className="mb-6 bg-[#FAFAFA] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <Link to="/" className="shrink-0">
              <BetterAngelsLogoIcon fill="#1E3342" className="h-9 w-auto" />
            </Link>

            <Link to="/operator">
              <Text
                variant="header-navbar"
                className="font-medium text-[#5A616B]"
              >
                {title}
              </Text>
            </Link>
            {isCreateShelterRoute && (
              <Text variant="header-navbar" className="font-medium text-black">
                / Shelter Creation
              </Text>
            )}

            {organizations.length > 1 && (
              <div className="ml-1 min-w-52">
                <Dropdown
                  label="Organization"
                  placeholder="Select organization"
                  options={orgOptions}
                  value={selectedOption}
                  onChange={(option) => {
                    if (option) setActiveOrgId(option.value);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isOperatorRoute && (
              <Link to="/operator/dashboard/create">
                <Button
                  variant="primary"
                  leftIcon={<Plus size={20} />}
                  rightIcon={false}
                >
                  Create Shelter
                </Button>
              </Link>
            )}

            <button
              type="button"
              aria-label="Account settings"
              className="inline-flex size-11 items-center justify-center rounded-full border border-[#D3D9E3] bg-white text-[#3E4652] transition-colors hover:bg-[#F8FAFC] pl-1 pb-0.25"
            >
              <UserCog size={20} />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet
          context={{
            organizations: organizations.map((org) => ({
              id: org.id,
              name: org.name,
            })),
            selectedOrganizationId,
            setSelectedOrganizationId: setActiveOrgId,
          }}
        />
      </main>
    </div>
  );
}

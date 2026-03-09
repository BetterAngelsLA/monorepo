import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import { Plus, UserCog } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './base-ui/buttons';
import { Dropdown } from './base-ui/dropdown';

type Organization = {
  id: string;
  name: string;
};

type NavBarProps = {
  organizations: Organization[];
  selectedOrganizationId: string;
  onOrganizationChange: (organizationId: string) => void;
};

function OperatorNavBar({
  organizations,
  selectedOrganizationId,
  onOrganizationChange,
}: NavBarProps) {
  const title =
    organizations.length === 1 ? organizations[0].name : 'Admin Dashboard';

  return (
    <div className="mb-6 bg-[#FAFAFA] px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link to="/" className="shrink-0">
            <BetterAngelsLogoIcon fill="#1E3342" className="h-9 w-auto" />
          </Link>

          <p className="truncate text-xl font-medium text-[#5A616B] md:text-2xl">
            {title}
          </p>

          {organizations.length > 1 && (
            <div className="ml-1 min-w-52">
              <Dropdown
                label="Organization"
                placeholder="Select organization"
                options={organizations.map((org) => ({
                  label: org.name,
                  value: org.id,
                }))}
                value={
                  organizations
                    .filter((org) => org.id === selectedOrganizationId)
                    .map((org) => ({ label: org.name, value: org.id }))[0] ??
                  null
                }
                onChange={(option) => {
                  if (option) onOrganizationChange(option.value);
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/operator/dashboard/create">
            <Button
              variant="small-light"
              leftIcon={<Plus size={20} />}
              rightIcon={false}
            >
              Create Shelter
            </Button>
          </Link>

          <Link to="/#">
            <button
              type="button"
              aria-label="Account settings"
              className="inline-flex size-11 items-center justify-center rounded-full border border-[#D3D9E3] bg-white text-[#3E4652] transition-colors hover:bg-[#F8FAFC]"
            >
              <UserCog size={20} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NavBar(props: NavBarProps) {
  const { pathname } = useLocation();
  const isOperatorRoute =
    pathname === '/operator' || pathname.startsWith('/operator/');

  if (!isOperatorRoute) {
    return null;
  }

  return <OperatorNavBar {...props} />;
}

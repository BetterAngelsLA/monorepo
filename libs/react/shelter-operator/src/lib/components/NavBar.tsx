import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import type { ReactNode } from 'react';
import { Plus, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActiveOrg } from '../providers/activeOrg';
import { Button } from './base-ui/buttons';
import { Dropdown } from './base-ui/dropdown';

function NavBarActions({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      {children}
      <button
        type="button"
        aria-label="Account settings"
        className="inline-flex size-11 items-center justify-center rounded-full border border-[#D3D9E3] bg-white text-[#3E4652] transition-colors hover:bg-[#F8FAFC] pl-1"
      >
        <UserCog size={20} />
      </button>
    </div>
  );
}

export default function NavBar() {
  const { activeOrg, organizations, setActiveOrgId } = useActiveOrg();
  const selectedOrganizationId = activeOrg?.id ?? '';

  const title =
    organizations.length === 1 ? organizations[0].name : 'Admin Dashboard';

  const selectedOption = (() => {
    const org = organizations.find((o) => o.id === selectedOrganizationId);
    return org ? { label: org.name, value: org.id } : null;
  })();

  return (
    <div className="mb-6 bg-[#FAFAFA] px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link to="/operator" className="shrink-0">
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
                value={selectedOption}
                onChange={(option) => {
                  if (option) setActiveOrgId(option.value);
                }}
              />
            </div>
          )}
        </div>

        <NavBarActions>
          <Link to="/operator/dashboard/create">
            <Button
              variant="primary"
              leftIcon={<Plus size={20} />}
              rightIcon={false}
            >
              Create Shelter
            </Button>
          </Link>
        </NavBarActions>
      </div>
    </div>
  );
}

export { NavBarActions };

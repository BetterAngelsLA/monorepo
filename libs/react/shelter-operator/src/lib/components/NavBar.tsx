import { useActiveOrg } from '@monorepo/ba-platform';
import { Dropdown as MenuDropdown } from '@monorepo/react/components';
import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { operatorPath, useSignOut } from '@monorepo/react/shelter';
import { Plus, UserCog } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useShelterOperatorProfile } from '../hooks';
import { isShelterRoute, paths } from '../routing';
import { Button } from './base-ui/buttons';
import { Dropdown } from './base-ui/dropdown';

enum AccountOption {
  SignOut = 'Sign Out',
}

function NavBarActions({
  children,
  onSignOut,
}: {
  children?: ReactNode;
  onSignOut: () => void;
}) {
  const handleAccountSelect = (option: AccountOption) => {
    if (option === AccountOption.SignOut) {
      onSignOut();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {children}
      <MenuDropdown
        title={
          <div
            aria-label="Account settings"
            className="inline-flex size-11 items-center justify-center rounded-full border border-[#D3D9E3] bg-white text-[#3E4652] transition-colors hover:bg-[#F8FAFC] pl-1"
          >
            <UserCog size={20} />
          </div>
        }
        options={[AccountOption.SignOut]}
        onSelect={handleAccountSelect}
        position="dropdown-end"
      />
    </div>
  );
}

type TNavProps = {
  className?: string;
};

export function NavBar(props: TNavProps) {
  const { className } = props;

  const { activeOrg, organizations, setActiveOrgId } = useActiveOrg();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useSignOut();
  const selectedOrganizationId = activeOrg?.id ?? '';

  const isDashboardPage =
    location.pathname === operatorPath ||
    location.pathname === `${operatorPath}/`;

  const showCreateButton = isDashboardPage;

  const orgName =
    organizations.length === 1 ? organizations[0].name : 'Admin Dashboard';

  // ── Shelter name ─────────────────────────────────────────────────────────

  const { shelterId } = useParams<{ shelterId: string }>();
  const { shelter: operatorShelter } = useShelterOperatorProfile(shelterId);
  const shelterName = operatorShelter?.name;
  const showShelterName = isShelterRoute(location.pathname) && !!shelterName;

  const selectedOption = useMemo(() => {
    const org = organizations.find((o) => o.id === selectedOrganizationId);
    return org ? { label: org.name, value: org.id } : null;
  }, [organizations, selectedOrganizationId]);

  const dropdownOptions = useMemo(
    () => organizations.map((org) => ({ label: org.name, value: org.id })),
    [organizations],
  );

  const handleOrgChange = useCallback(
    (option: { value: string } | null) => {
      if (option) setActiveOrgId(option.value);
    },
    [setActiveOrgId],
  );

  const parentCss = ['bg-[#FAFAFA]', 'px-5', 'py-3', className];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link to={operatorPath} className="shrink-0">
            <BetterAngelsLogoIcon fill="#1E3342" className="h-9 w-auto" />
          </Link>
          <p className="truncate text-xl font-medium text-[#5A616B] md:text-2xl">
            {orgName}
          </p>

          {showShelterName && (
            <p className="truncate text-xl text-[#5A616B] md:text-2xl">
              {shelterName}
            </p>
          )}

          {organizations.length > 1 && (
            <div className="ml-1 min-w-52">
              <Dropdown
                label="Organization"
                placeholder="Select organization"
                options={dropdownOptions}
                value={selectedOption}
                onChange={handleOrgChange}
              />
            </div>
          )}
        </div>

        <NavBarActions onSignOut={signOut}>
          {showCreateButton && (
            <Button
              leftIcon={<Plus size={20} />}
              rightIcon={false}
              onClick={() => navigate(paths.shelterCreate)}
            >
              Create Shelter
            </Button>
          )}
        </NavBarActions>
      </div>
    </div>
  );
}

export { NavBarActions };

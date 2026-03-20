import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import { Plus, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActiveOrg } from '../providers/activeOrg';
import { Button } from './base-ui/buttons';
import { Dropdown } from './base-ui/dropdown';

interface NavBarProps {
  organizationName?: string;
  shelterName?: string;
  pageTitle?: string;
}

export default function NavBar({
  organizationName,
  shelterName,
  pageTitle,
}: NavBarProps = {}) {
  const { activeOrg, organizations, setActiveOrgId } = useActiveOrg();
  const selectedOrganizationId = activeOrg?.id ?? '';

  // Build breadcrumbs array
  const breadcrumbs = [organizationName, shelterName, pageTitle].filter(
    Boolean
  );

  // Determine title/breadcrumb display
  const displayTitle =
    breadcrumbs.length > 0
      ? null
      : organizations.length === 1
        ? organizations[0].name
        : 'Admin Dashboard';

  return (
    <div className="mb-6 bg-[#FAFAFA] px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link to="/" className="shrink-0">
            <BetterAngelsLogoIcon fill="#1E3342" className="h-9 w-auto" />
          </Link>

          {breadcrumbs.length > 0 ? (
            <div className="flex items-center gap-2 text-base md:text-xl">
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-gray-400 font-normal">/</span>
                  )}
                  <span
                    className={
                      index === breadcrumbs.length - 1
                        ? 'font-medium text-[#5A616B]'
                        : 'font-normal text-[#5A616B]'
                    }
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="truncate text-xl font-medium text-[#5A616B] md:text-2xl">
              {displayTitle}
            </p>
          )}

          {organizations.length > 1 && breadcrumbs.length === 0 && (
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
                  if (option) setActiveOrgId(option.value);
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/operator/dashboard/create">
            <Button
              variant="primary"
              leftIcon={<Plus size={20} />}
              rightIcon={false}
            >
              Create Shelter
            </Button>
          </Link>
          <button
            type="button"
            aria-label="Account settings"
            className="inline-flex size-11 items-center justify-center rounded-full border border-[#D3D9E3] bg-white text-[#3E4652] transition-colors hover:bg-[#F8FAFC] pl-1"
          >
            <UserCog size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

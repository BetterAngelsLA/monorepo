import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { operatorPath } from '@monorepo/react/shelter';
import { Plus, UserCog } from 'lucide-react';
import type { ReactNode } from 'react';
import { Fragment, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useActiveOrg } from '../providers/activeOrg';
import { paths } from '../routing';
import { Button } from './base-ui/buttons';
import { Dropdown } from './base-ui/dropdown';
import {
  parseBreadcrumbs,
  useBreadcrumbNames,
  type BreadcrumbItem,
} from './NavBar/breadcrumbs';

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

type TNavProps = {
  className?: string;
};

export function NavBar(props: TNavProps) {
  const { className } = props;

  const { activeOrg, organizations, setActiveOrgId } = useActiveOrg();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedOrganizationId = activeOrg?.id ?? '';

  const isDashboardPage =
    location.pathname === operatorPath ||
    location.pathname === `${operatorPath}/`;

  const showCreateButton = isDashboardPage;

  const displayTitle =
    organizations.length === 1 ? organizations[0].name : 'Admin Dashboard';

  // ── Breadcrumbs ──────────────────────────────────────────────────────────

  const rawBreadcrumbs = useMemo(
    () => parseBreadcrumbs(location.pathname),
    [location.pathname]
  );
  const { items: breadcrumbs } = useBreadcrumbNames(rawBreadcrumbs);

  const showBreadcrumbs = rawBreadcrumbs.length > 0;

  const selectedOption = useMemo(() => {
    const org = organizations.find((o) => o.id === selectedOrganizationId);
    return org ? { label: org.name, value: org.id } : null;
  }, [organizations, selectedOrganizationId]);

  const dropdownOptions = useMemo(
    () => organizations.map((org) => ({ label: org.name, value: org.id })),
    [organizations]
  );

  const handleOrgChange = useCallback(
    (option: { value: string } | null) => {
      if (option) setActiveOrgId(option.value);
    },
    [setActiveOrgId]
  );

  const parentCss = ['bg-[#FAFAFA]', 'px-5', 'py-3', className];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link to={operatorPath} className="shrink-0">
            <BetterAngelsLogoIcon fill="#1E3342" className="h-9 w-auto" />
          </Link>

          {showBreadcrumbs ? (
            <BreadcrumbTrail items={breadcrumbs} />
          ) : (
            <p className="truncate text-xl font-medium text-[#5A616B] md:text-2xl">
              {displayTitle}
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

        <NavBarActions>
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

// ── BreadcrumbTrail ─────────────────────────────────────────────────────────

/**
 * Renders breadcrumb trail with `/` separators, clickable links,
 * and mobile truncation (shows only last 2 items on < md screens
 * with a "..." collapsed indicator).
 */
function BreadcrumbTrail({ items }: { items: BreadcrumbItem[] }) {
  const visibleItems = items;
  const truncateCount = items.length > 2 ? items.length - 2 : 0;

  return (
    <div className="flex items-center gap-2 text-base md:text-xl min-w-0">
      {/* Desktop: show all items */}
      <span className="hidden md:contents">
        {visibleItems.map((item, index) => (
          <Fragment key={index}>
            {index > 0 && (
              <span className="text-gray-400 font-normal shrink-0">/</span>
            )}
            <BreadcrumbSegment
              item={item}
              isLast={index === items.length - 1}
            />
          </Fragment>
        ))}
      </span>

      {/* Mobile: show "..." + last 2 items */}
      <span className="contents md:hidden">
        {truncateCount > 0 && (
          <>
            <span className="text-gray-400 font-normal shrink-0">…</span>
            <span className="text-gray-400 font-normal shrink-0">/</span>
          </>
        )}
        {visibleItems.slice(-2).map((item, index, slice) => (
          <Fragment key={index}>
            {index > 0 && (
              <span className="text-gray-400 font-normal shrink-0">/</span>
            )}
            <BreadcrumbSegment
              item={item}
              isLast={index === slice.length - 1}
            />
          </Fragment>
        ))}
      </span>
    </div>
  );
}

function BreadcrumbSegment({
  item,
  isLast,
}: {
  item: BreadcrumbItem;
  isLast: boolean;
}) {
  const className = isLast
    ? 'font-medium text-[#5A616B] truncate'
    : 'font-normal text-[#5A616B] truncate';

  if (item.path === '#') {
    return <span className={className}>{item.label}</span>;
  }

  return (
    <Link to={item.path} className={`${className} hover:underline`}>
      {item.label}
    </Link>
  );
}

export { NavBarActions };

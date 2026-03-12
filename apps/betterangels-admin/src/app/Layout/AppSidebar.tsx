import {
  UserOrganizationPermissions,
  useActiveOrg,
} from '@monorepo/react/betterangels-admin';
import { BetterAngelsLogoBadge, Sidebar } from '@monorepo/react/components';
import { BarChartIcon, ChevronUpIcon, UsersIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

type IProps = {
  className?: string;
};

export function AppSidebar(props: IProps) {
  const { className } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeOrg, organizations, setActiveOrgId, hasPermission } =
    useActiveOrg();
  const location = useLocation();

  const hasMultipleOrgs = organizations.length > 1;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <Sidebar className={mergeCss(className)} onOpenChange={setIsOpen}>
      <Sidebar.Header>
        <div className="flex items-center w-full relative" ref={dropdownRef}>
          <BetterAngelsLogoBadge className="ml-1 mr-2 flex-shrink-0" />

          {activeOrg?.name && isOpen && (
            <div className="flex flex-col flex-1 min-w-0">
              {hasMultipleOrgs ? (
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1 text-primary-20 font-semibold text-lg leading-tight truncate bg-transparent border-none outline-none cursor-pointer p-0 hover:text-primary-60 transition-colors"
                >
                  <span className="truncate">{activeOrg.name}</span>
                  <ChevronUpIcon
                    className={mergeCss([
                      'w-3 h-3 flex-shrink-0 transition-transform duration-200',
                      dropdownOpen ? '' : 'rotate-180',
                    ])}
                    fill="currentColor"
                  />
                </button>
              ) : (
                <h2 className="text-lg font-semibold truncate text-primary-20 leading-tight m-0">
                  {activeOrg.name}
                </h2>
              )}
            </div>
          )}

          {dropdownOpen && hasMultipleOrgs && activeOrg && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-90 rounded-lg shadow-lg py-1 z-50 list-none m-0 p-0">
              {organizations.map((org) => {
                const isSelected = org.id === activeOrg.id;

                return (
                  <li key={org.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveOrgId(org.id);
                        setDropdownOpen(false);
                      }}
                      className={mergeCss([
                        'w-full text-left px-3 py-2 text-sm truncate border-none bg-transparent cursor-pointer transition-colors',
                        isSelected
                          ? 'text-primary-60 font-semibold bg-neutral-98'
                          : 'text-primary-20 hover:bg-neutral-98',
                      ])}
                    >
                      {org.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Sidebar.Header>
      <Sidebar.Content>
        {hasPermission(UserOrganizationPermissions.ViewOrgMembers) && (
          <Sidebar.Link
            to="/users"
            isActive={location.pathname === '/users'}
            collapsed={!isOpen}
            icon={(color: string) => <UsersIcon className="w-4" fill={color} />}
          >
            Users
          </Sidebar.Link>
        )}
        {hasPermission(UserOrganizationPermissions.ViewReports) && (
          <Sidebar.Link
            to="/reports"
            isActive={location.pathname === '/reports'}
            collapsed={!isOpen}
            icon={(color: string) => (
              <BarChartIcon className="w-4" fill={color} />
            )}
          >
            Reports
          </Sidebar.Link>
        )}
      </Sidebar.Content>
    </Sidebar>
  );
}

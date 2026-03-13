import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useActiveOrg } from '../../providers/activeOrg';

export function OperatorLayout() {
  const { activeOrg, organizations, setActiveOrgId } = useActiveOrg();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasMultipleOrgs = organizations.length > 1;

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <Link
          to="/operator"
          className="text-lg font-semibold text-gray-900 no-underline"
        >
          Shelter Operator
        </Link>

        {activeOrg && hasMultipleOrgs && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span className="max-w-[200px] truncate">{activeOrg.name}</span>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <ul className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50 list-none m-0 p-0">
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
                        className={`w-full text-left px-3 py-2 text-sm border-none bg-transparent cursor-pointer transition-colors truncate ${
                          isSelected
                            ? 'text-blue-600 font-semibold bg-blue-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {org.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeOrg && !hasMultipleOrgs && (
          <span className="text-sm font-medium text-gray-500">
            {activeOrg.name}
          </span>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

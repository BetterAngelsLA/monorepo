import { UserIcon } from '@monorepo/react/icons';
import * as React from 'react';
import { Link } from 'react-router-dom';
import './index.css';

export function ProfileDropdown(): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block z-[9999]" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-[#2a4563] transition-colors duration-150"
        type="button"
        aria-label="Open profile menu"
      >
        <UserIcon className="h-6 w-6 text-white" />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-[9999] animate-dropdownSmooth"
          style={{ minWidth: '12rem' }}
        >
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-3 text-left text-gray-800 hover:bg-gray-50 transition-colors duration-150"
          >
            Profile
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-3 text-left text-gray-800 hover:bg-gray-50 transition-colors duration-150 border-t border-gray-200"
            type="button"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function Profile(): React.ReactElement {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-4 text-gray-600">Profile page coming soon.</p>
    </div>
  );
}

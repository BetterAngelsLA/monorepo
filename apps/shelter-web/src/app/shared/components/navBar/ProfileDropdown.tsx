import { UserIcon } from '@monorepo/react/icons';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './ProfileDropdown.css';

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    <div ref={menuRef} className="relative inline-block z-[9999]">
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-[#2a4563] transition-colors duration-150"
        type="button"
      >
        <UserIcon className="h-6 w-6 text-white" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="profile-dropdown absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-[9999]">
          {/* Profile Link */}
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-3 text-left text-gray-800 hover:bg-gray-50 transition-colors duration-150"
          >
            Profile
          </Link>

          {/* Logout Button */}
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

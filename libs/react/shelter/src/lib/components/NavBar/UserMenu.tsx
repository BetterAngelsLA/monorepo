import { UserIcon } from '@monorepo/react/icons';
import { useEffect, useRef, useState } from 'react';
import { TUser } from '../../providers';

type UserMenuProps = {
  user: TUser;
  signOut: () => Promise<void>;
};

/**
 * The signed-in account menu: initials (or a user icon) that open the account
 * details and sign out.
 *
 * Owns its open state and the click-outside listener, which is why it is not
 * inline in `Navigation`: that leaves `Navigation` as the layout of nav links
 * plus the mobile hamburger, and gives this behaviour a component to be tested
 * on its own — signed-in state isn't something the browser e2e suite sets up.
 */
export function UserMenu({ user, signOut }: UserMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const initials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="User menu"
        className="flex items-center justify-center size-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-semibold"
      >
        {initials ?? <UserIcon className="w-4 h-4" fill="white" />}
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-50">
          <div className="px-4 py-2 border-b border-neutral-90">
            <p className="text-sm font-medium text-neutral-20 truncate">
              {user.firstName} {user.lastName}
            </p>
            {user.email && (
              <p className="text-xs text-neutral-40 truncate">{user.email}</p>
            )}
          </div>
          <button
            onClick={signOut}
            className="w-full text-left px-4 py-2 text-sm text-neutral-20 hover:bg-neutral-98 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

import { MenuIcon, UserIcon } from '@monorepo/react/icons';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FeatureFlags,
  aboutUsPath,
  operatorPath,
  shelterHomePath,
  shelterVideoPath,
  signInPath,
} from '../../constants';
import { useSignOut, useUser } from '../../providers';
import { FlyoutAnimationEnum, flyoutAtom } from '../Flyout';
import { MenuMobile } from './MenuMobile';

export function Navigation() {
  const [_flyout, setFlyout] = useAtom(flyoutAtom);
  const showOperator = useFeatureFlagActive(FeatureFlags.SHELTER_OPERATOR_APP);
  const { user } = useUser();
  const { signOut } = useSignOut();
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

  function onClick() {
    setFlyout({
      content: (
        <MenuMobile showOperator={showOperator} user={user} signOut={signOut} />
      ),
      closeOnClick: true,
      animation: FlyoutAnimationEnum.FLYOUT_LEFT,
    });
  }

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : null;

  return (
    <div>
      <button onClick={onClick}>
        <MenuIcon className="h-4 block lg:hidden mt-2" fill="white" />
      </button>
      <div className="hidden lg:flex items-center space-x-10 text-sm mb-5">
        <Link aria-label="navigate to shelter homepage" to={shelterHomePath}>
          Home
        </Link>
        <Link aria-label="navigate to about us" to={aboutUsPath}>
          About Us
        </Link>
        <Link
          aria-label="watch shelter directory video overview"
          to={shelterVideoPath}
        >
          Watch Video
        </Link>
        {showOperator ? (
          <Link aria-label="navigate to operator dashboard" to={operatorPath}>
            Operator
          </Link>
        ) : null}
        {user ? (
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
                    <p className="text-xs text-neutral-40 truncate">
                      {user.email}
                    </p>
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
        ) : (
          <Link aria-label="sign in" to={signInPath}>
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}

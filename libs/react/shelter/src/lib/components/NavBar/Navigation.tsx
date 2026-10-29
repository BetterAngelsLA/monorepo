import { MenuIcon } from '@monorepo/react/icons';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
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
import { UserMenu } from './UserMenu';

export function Navigation() {
  const [_flyout, setFlyout] = useAtom(flyoutAtom);
  const showOperator = useFeatureFlagActive(FeatureFlags.SHELTER_OPERATOR_APP);
  const { user } = useUser();
  const { signOut } = useSignOut();

  function openMobileMenu() {
    setFlyout({
      content: (
        <MenuMobile showOperator={showOperator} user={user} signOut={signOut} />
      ),
      closeOnClick: true,
      animation: FlyoutAnimationEnum.FLYOUT_LEFT,
    });
  }

  return (
    <div>
      <button
        onClick={openMobileMenu}
        aria-label="Open navigation"
        className="lg:hidden"
      >
        <MenuIcon className="h-4 block mt-2" fill="white" />
      </button>

      <div className="hidden lg:flex items-center space-x-10 text-sm">
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

        {showOperator && (
          <Link aria-label="navigate to operator dashboard" to={operatorPath}>
            Operator
          </Link>
        )}

        {user ? (
          <UserMenu user={user} signOut={signOut} />
        ) : (
          <Link aria-label="sign in" to={signInPath}>
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}

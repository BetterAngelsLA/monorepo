import { MenuIcon } from '@monorepo/react/icons';
import { useFeatureFlagActive } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { Link } from 'react-router-dom';
import { FeatureFlags } from '../../../constants/featureFlags';
import {
  aboutUsPath,
  operatorPath,
  shelterHomePath,
} from '../../../routes/routePaths';
import { flyoutAtom } from '../../atoms/flyoutAtom';
import { FlyoutAnimationEnum } from '../../flyout/Flyout';
import { MenuMobile } from './MenuMobile';

export function MenuBtnMobile() {
  const [_flyout, setFlyout] = useAtom(flyoutAtom);
  const showOperator = useFeatureFlagActive(FeatureFlags.SHELTER_OPERATOR_APP);

  function onClick() {
    setFlyout({
      content: <MenuMobile showOperator={showOperator} />,
      closeOnClick: true,
      animation: FlyoutAnimationEnum.FLYOUT_LEFT,
    });
  }

  return (
    <div>
      <button onClick={onClick}>
        <MenuIcon className="h-4 block lg:hidden mt-2" fill="white" />
      </button>
      <div className="hidden lg:flex space-x-10 text-sm mb-5">
        <Link aria-label="navigate to shelter homepage" to={shelterHomePath}>
          Home
        </Link>
        <Link aria-label="navigate to about us" to={aboutUsPath}>
          About Us
        </Link>
<<<<<<< HEAD
        <Link aria-label="navigate to about us" to="/operator">
          Operator Portal
        </Link>
=======
        {showOperator ? (
          <Link aria-label="navigate to operator dashboard" to={operatorPath}>
            Operator
          </Link>
        ) : null}
>>>>>>> main
      </div>
    </div>
  );
}

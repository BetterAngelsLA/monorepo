import { MenuIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { Link } from 'react-router-dom';
import { aboutUsPath, shelterHomePath } from '../../../routes/routePaths';
import { flyoutAtom } from '../../atoms/flyoutAtom';
import { FlyoutAnimationEnum } from '../../flyout/Flyout';
import { MenuMobile } from './MenuMobile';

export function MenuBtnMobile() {
  const [_flyout, setFlyout] = useAtom(flyoutAtom);

  function onClick() {
    setFlyout({
      content: <MenuMobile />,
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
        <Link aria-label="navigate to about us" to="/operator">
          Operator Portal
        </Link>
      </div>
    </div>
  );
}

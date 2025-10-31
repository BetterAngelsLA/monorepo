import { CloseIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { Link } from 'react-router-dom';
import {
  aboutUsPath,
  operatorPath,
  shelterHomePath,
} from '../../../routes/routePaths';
import { flyoutAtom } from '../../atoms/flyoutAtom';
import { mergeCss } from '../../utils/styles/mergeCss';

export function MenuMobile() {
  const [_flyout, setFlyout] = useAtom(flyoutAtom);

  function onFlyoutClose() {
    setFlyout(null);
  }

  const parentCss = [
    'flex',
    'flex-col',
    'p-4',
    'mt-8',
    'font-medium',
    'text-white',
    'font-primary',
  ];

  const hoverBtnCss = [
    'w-full',
    'h-[54px]',
    'hover:bg-[#375C76]',
    'rounded-md',
    'transition',
    'flex',
    'items-center',
    'px-4',
  ];

  const closeBtnContainerCss = ['flex', 'justify-start', 'p-4'];
  const borderCss = ['w-full', 'border-b', 'border-[#375c76]'];
  const closeBtnCss = ['text-white'];

  return (
    <>
      <div className={mergeCss(closeBtnContainerCss)}>
        <button className={mergeCss(closeBtnCss)} onClick={onFlyoutClose}>
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      <div className={mergeCss(parentCss)}>
        <div className={mergeCss(borderCss)}>
          <Link
            aria-label="navigate to shelter homepage"
            to={shelterHomePath}
            className={mergeCss(hoverBtnCss)}
          >
            Home
          </Link>
        </div>
        <div>
          <Link
            aria-label="navigate to about us"
            to={aboutUsPath}
            className={mergeCss(hoverBtnCss)}
          >
            About Us
          </Link>
        </div>
        <div>
          <Link
            aria-label="navigate to operator page"
            to={operatorPath}
            className={mergeCss(hoverBtnCss)}
          >
            Operator
          </Link>
        </div>
      </div>
    </>
  );
}

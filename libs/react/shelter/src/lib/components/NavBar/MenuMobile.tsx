import { CloseIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { Link } from 'react-router-dom';
import { aboutUsPath, operatorPath, shelterHomePath } from '../../constants';
import { flyoutAtom } from '../Flyout';

type MenuMobileProps = {
  showOperator: boolean;
};

export function MenuMobile({ showOperator }: MenuMobileProps) {
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
        <div className={mergeCss(borderCss)}>
          <Link
            aria-label="navigate to about us"
            to={aboutUsPath}
            className={mergeCss(hoverBtnCss)}
          >
            About Us
          </Link>
        </div>
        {showOperator ? (
          <div>
            <Link
              aria-label="navigate to operator dashboard"
              to={operatorPath}
              className={mergeCss(hoverBtnCss)}
            >
              Operator
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}

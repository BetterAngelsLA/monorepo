import { CloseIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { Link } from 'react-router-dom';
import {
  aboutUsPath,
  operatorPath,
  shelterHomePath,
  shelterVideoPath,
  signInPath,
} from '../../constants';
import { TUser } from '../../providers';
import { flyoutAtom } from '../Flyout';

type MenuMobileProps = {
  showOperator: boolean;
  user: TUser | undefined;
  signOut: () => Promise<void>;
};

export function MenuMobile({ showOperator, user, signOut }: MenuMobileProps) {
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
        <div className={mergeCss(borderCss)}>
          <Link
            aria-label="watch shelter directory video overview"
            to={shelterVideoPath}
            className={mergeCss(hoverBtnCss)}
          >
            Watch Video
          </Link>
        </div>
        <div className={mergeCss(borderCss)}>
          <Link
            to="https://www.lahsa.org/documents?id=2760-ces-access-center-directory.pdf"
            className={mergeCss(hoverBtnCss)}
          >
            Access Center Directory
          </Link>
        </div>

        {showOperator ? (
          <div className={mergeCss(borderCss)}>
            <Link
              aria-label="navigate to operator dashboard"
              to={operatorPath}
              className={mergeCss(hoverBtnCss)}
            >
              Operator
            </Link>
          </div>
        ) : null}

        <div className={mergeCss(borderCss)}>
          {user ? (
            <button
              aria-label="sign out"
              onClick={() => {
                setFlyout(null);
                signOut();
              }}
              className={mergeCss(hoverBtnCss)}
            >
              Sign Out
            </button>
          ) : (
            <Link
              aria-label="sign in"
              to={signInPath}
              onClick={() => setFlyout(null)}
              className={mergeCss(hoverBtnCss)}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

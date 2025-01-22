import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import { ReactElement } from 'react';
import { Link } from 'react-router-dom';

type IParams = {
  className?: string;
};

export function Footer(props: IParams): ReactElement {
  const { className = '' } = props;

  const parentCss = [
    className,
    'w-full',
    'max-w-7xl',
    'mx-auto',
    'flex-col',
    'md:flex-row',
    'flex',
    'justify-between',
    'min-h-52',
    'py-20',
    'text-white',
  ].join(' ');

  return (
    <footer className={parentCss}>
      <a href="https://www.betterangels.la/" className="flex mb-8 md:mb-0">
        <BetterAngelsLogoIcon className="h-7 md:h-10 text-brand-sky-blue fill-current" />
        <div className="text-white flex ml-2 text-xl md:text-4xl">
          <div className="font-normal notranslate">
            Better<span className="font-semibold">Angels</span>
          </div>
        </div>
      </a>
      <div className="flex flex-col align-end gap-14">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 md:text-2xl">
          <Link to="#">About</Link>
          <Link to="#">Contact Us</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
        <div className="md:text-2xl text-end md:text-auto">
          © 2025 Better Angels Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

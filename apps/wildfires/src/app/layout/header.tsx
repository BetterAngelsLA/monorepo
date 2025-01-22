import {
  BetterAngelsLogoIcon,
  GlobeIcon,
  MenuIcon,
} from '@monorepo/react/icons';
import { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { mergeCss } from '../shared/utils/styles/mergeCss';

type IParams = {
  className?: string;
};

export function Header(props: IParams): ReactElement {
  const { className = '' } = props;

  const parentCss = [
    'w-full',
    'mx-auto',
    'flex',
    'items-center',
    'justify-between',
    'h-[104px]',
    'md:h-[78px]',
    'text-white',
    className,
  ];

  return (
    <header className={mergeCss(parentCss)}>
      <Link to="/" className="flex items-center">
        <BetterAngelsLogoIcon className="h-7 sm:h-10 text-brand-sky-blue fill-current" />
        <div className="text-white flex ml-2 text-xl md:text-4xl">
          <div className="font-normal">
            Wildfire <span className="font-semibold">LA</span>
          </div>
        </div>
      </Link>
      {/* Desktop */}
      <div className="hidden md:flex items-center font-bold">
        <p className="mr-8">Select Language</p>
        <Link className="mr-12" to="/about">
          About Wildfire LA
        </Link>
        <a
          target="_blank"
          href="https://www.pledge.to/widgets/donate/JS11PeUKJh7pCqZC"
          className="border-2 border-brand-yellow rounded-full py-1 px-7 hover:bg-brand-yellow hover:text-black"
          onClick={() => console.log('donate')}
          rel="noreferrer"
        >
          Donate
        </a>
      </div>
      {/* Mobile */}
      <div className="flex md:hidden items-center font-bold gap-7">
        <div className="h-10 w-10 flex items-center justify-center">
          <GlobeIcon className="h-6 w-6" stroke="white" />
        </div>
        <div className="h-10 w-10 flex items-center justify-center">
          <MenuIcon className="h-6 w-6" fill="white" />
        </div>
      </div>
    </header>
  );
}

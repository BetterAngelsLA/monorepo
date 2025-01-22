import {
  BetterAngelsLogoIcon,
  GlobeIcon,
  MenuIcon,
} from '@monorepo/react/icons';
import { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../shared/components/button/Button';

type IParams = {
  className?: string;
};

export function Header(props: IParams): ReactElement {
  const { className = '' } = props;

  const parentCss = [
    className,
    'w-full',
    'max-w-7xl',
    'mx-auto',
    'flex',
    'items-center',
    'justify-between',
    'h-[104px]',
    'md:h-[78px]',
    'text-white',
  ].join(' ');

  return (
    <header className={parentCss}>
      <div className="flex items-center">
        <BetterAngelsLogoIcon className="h-7 sm:h-10 text-brand-sky-blue fill-current" />
        <div className="text-white flex ml-2 text-xl md:text-4xl">
          <div className="font-normal">
            Wildfire <span className="font-semibold">LA</span>
          </div>
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden md:flex items-center font-bold">
        <p className="mr-8">Select Language</p>
        <Link className="mr-12" to="#">
          About Wildfire LA
        </Link>
        <Button
          size="small"
          className="border-brand-yellow"
          onClick={() => console.log('donate')}
        >
          Donate
        </Button>
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

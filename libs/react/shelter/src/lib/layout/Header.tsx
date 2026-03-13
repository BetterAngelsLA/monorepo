import { BaShelterLogoIcon } from '@monorepo/react/icons';
import { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { Navigation } from '../components';

type IParams = {
  className?: string;
};

export function Header(props: IParams): ReactElement | null {
  const { className = '' } = props;
  const { pathname } = useLocation();
  const isOperatorRoute =
    pathname === '/operator' || pathname.startsWith('/operator/');

  if (isOperatorRoute) {
    return null;
  }

  const parentCss = [
    className,
    'w-full',
    'flex',
    'items-center',
    'justify-between',
    'h-[42px]',
    'text-white',
  ].join(' ');

  return (
    <header className={parentCss}>
      <div className="flex items-center">
        <BaShelterLogoIcon className="h-4" />
        <div className="text-white flex ml-2 text-sm">
          <div className="font-normal">Shelter</div>
          <div className="font-semibold">LA</div>
        </div>
      </div>
      <Navigation />
    </header>
  );
}

import { BaShelterLogoIcon } from '@monorepo/react/icons';
import { ReactElement } from 'react';
import { MenuIcon } from '@monorepo/react/icons';

type IParams = {
  className?: string;
};

export function Header(props: IParams): ReactElement {
  const { className = '' } = props;

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
      <MenuIcon className="h-4 block lg:hidden" fill="white" />
      <div className="hidden lg:flex space-x-10 text-sm">
        <div>HOME</div>
        <div>ABOUT US</div>
      </div>
    </header>
  );
}

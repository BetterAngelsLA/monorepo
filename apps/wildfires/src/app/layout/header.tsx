import { BetterAngelsLogoIcon } from '@monorepo/react/icons';
import { ReactElement } from 'react';

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
    'h-[42px]',
    'text-white',
  ].join(' ');

  return (
    <header className={parentCss}>
      <div className="flex items-center">
        <BetterAngelsLogoIcon className="h-4" />
        <div className="text-white flex ml-2 text-sm">
          <div className="font-normal">Wildfire</div>
          <div className="font-semibold">LA</div>
        </div>
      </div>
    </header>
  );
}

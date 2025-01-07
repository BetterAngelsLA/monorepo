import { BaShelterLogoIcon } from '@monorepo/react/icons';
import { ReactElement } from 'react';

type IParams = {
  className?: string;
};

export function Footer(props: IParams): ReactElement {
  const { className = '' } = props;

  const parentCss = [
    className,
    'w-full',
    'flex',
    'flex-col',
    'min-h-52',
    'py-12',
    'text-white',
  ].join(' ');

  return (
    <footer className={parentCss}>
      <div className="flex items-center">
        <BaShelterLogoIcon className="h-8" />
        <div className="text-white flex ml-3 text-2xl">
          <div className="font-normal">Shelters</div>
          <div className="font-semibold">LA</div>
        </div>
      </div>
      <div className="mt-6 border-t-[0.5px] border-white pt-6 flex justify-end">
        <div className="text-xs">
          © 2024 Better Angels Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

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
      <div className="border-t-[0.5px] border-white pt-6 flex justify-end">
        <div className="text-xs">
          © 2024 Better Angels Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

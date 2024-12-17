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

  return <header className={parentCss}>hello shelter-app</header>;
}

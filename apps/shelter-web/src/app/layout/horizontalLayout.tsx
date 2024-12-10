import { PropsWithChildren, ReactElement } from 'react';

interface IParams extends PropsWithChildren {
  className?: string;
  fullWidth?: boolean;
}

export function HorizontalLayout(props: IParams): ReactElement {
  const { className = '', fullWidth, children } = props;

  const parentCss = [
    className,
    'w-full',
    'flex',
    'flex-col',
    'items-center',
    fullWidth ? 'w-screen -mx-4' : 'px-4',
  ].join(' ');

  const innerCss = ['max-w-7xl', 'w-full', 'flex', 'flex-col'].join(' ');

  return (
    <div className={parentCss}>
      <div className={fullWidth ? 'w-full' : innerCss}>{children}</div>
    </div>
  );
}

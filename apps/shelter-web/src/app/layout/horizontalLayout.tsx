import { PropsWithChildren, ReactElement } from 'react';

interface IParams extends PropsWithChildren {
  className?: string;
  fullW?: boolean;
}

export function HorizontalLayout(props: IParams): ReactElement {
  const { className = '', fullW, children } = props;

  const parentCss = [
    className,
    'w-full',
    'flex',
    'flex-col',
    'items-center',
    fullW ? 'px-0' : 'px-4',
  ].join(' ');

  const innerCss = ['max-w-7xl', 'w-full', 'flex', 'flex-col'].join(' ');

  return (
    <div className={parentCss}>
      <div className={innerCss}>{children}</div>
    </div>
  );
}

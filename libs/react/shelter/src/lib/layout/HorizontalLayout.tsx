import { mergeCss } from '@monorepo/react/shared';
import { PropsWithChildren, ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { MaxWLayout } from './MaxWLayout';

interface IParams extends PropsWithChildren {
  className?: string;
}

export function HorizontalLayout(props: IParams): ReactElement {
  const { className, children } = props;
  const { pathname } = useLocation();
  const isOperatorRoute = pathname.slice(0, 9) === '/operator'; // if pathname has /operator in URL, remove padding (done to allow NavBar to extend end-to-end), NOTE: may affect padding in operator app

  const parentCss = [
    'w-full',
    'flex',
    'flex-col',
    'items-center',
    !isOperatorRoute && 'px-4',
    className,
  ];

  console.log(isOperatorRoute);

  return (
    <div className={mergeCss(parentCss)}>
      <MaxWLayout>{children}</MaxWLayout>
    </div>
  );
}

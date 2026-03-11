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
  const isOperatorRoute = pathname === '/operator' || pathname === '/operator/';

  const parentCss = [
    'w-full',
    'flex',
    'flex-col',
    'items-center',
    !isOperatorRoute && 'px-4',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <MaxWLayout>{children}</MaxWLayout>
    </div>
  );
}

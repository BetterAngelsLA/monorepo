import { PropsWithChildren, ReactElement } from 'react';
import { twCss } from '../shared/utils/styles/twCss';
import { MaxWLayout } from './maxWLayout';

interface IParams extends PropsWithChildren {
  className?: string;
}

export function HorizontalLayout(props: IParams): ReactElement {
  const { className = '', children } = props;

  const parentCss = [
    'w-full',
    'flex',
    'flex-col',
    'items-center',
    'px-4',
    className,
  ];

  return (
    <div className={twCss(parentCss)}>
      <MaxWLayout>{children}</MaxWLayout>
    </div>
  );
}

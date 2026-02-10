import { PropsWithChildren, ReactElement } from 'react';
import { mergeCss } from '@monorepo/react/shared';
import { MaxWLayout } from './maxWLayout';

interface IParams extends PropsWithChildren {
  className?: string;
}

export function HorizontalLayout(props: IParams): ReactElement {
  const { className, children } = props;

  const parentCss = [
    'w-full',
    'flex',
    'flex-col',
    'items-center',
    'px-4',
    'md:px-10',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <MaxWLayout>{children}</MaxWLayout>
    </div>
  );
}

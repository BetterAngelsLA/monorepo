import { MaxWLayout } from '@monorepo/layout/maxWLayout';
import { mergeCss } from '@monorepo/layout/styles/mergeCss';
import { PropsWithChildren, ReactElement } from 'react';

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
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <MaxWLayout>{children}</MaxWLayout>
    </div>
  );
}

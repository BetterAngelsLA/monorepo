import { PropsWithChildren, ReactElement } from 'react';
import { mergeCss } from '../shared/utils/styles/mergeCss';
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
    'px-10',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <MaxWLayout>{children}</MaxWLayout>
    </div>
  );
}

import { PropsWithChildren, ReactElement } from 'react';
import { mergeCss } from '../shared/utils/styles/mergeCss';

interface IParams extends PropsWithChildren {
  className?: string;
}

export function MaxWLayout(props: IParams): ReactElement {
  const { className, children } = props;

  const parentCss = [
    'max-w-7xl',
    'min-w-full',
    'flex',
    'flex-col',
    'lg:mx-0',
    className,
  ];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}

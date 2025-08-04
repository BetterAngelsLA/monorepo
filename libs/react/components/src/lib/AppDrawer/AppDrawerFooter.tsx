import { PropsWithChildren } from 'react';

import { mergeCss } from '@monorepo/react/components';

interface IProps extends PropsWithChildren {
  className?: string;
}

export function AppDrawerFooter(props: IProps) {
  const { className, children } = props;

  const parentCss = [
    'flex',
    'mt-auto',
    'p-6',
    'border-t',
    'border-neutral-90',
    className,
  ];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}

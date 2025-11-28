import { mergeCss } from '@monorepo/layout/styles/mergeCss';
import { PropsWithChildren } from 'react';

interface TProps extends PropsWithChildren {
  className?: string;
}

export function ControlBtnWrapper(props: TProps) {
  const { children, className } = props;

  const parentCss = [
    'w-10',
    'h-10',
    'bg-white',
    'border',
    'border-neutral-90',
    'rounded-lg',
    className,
  ];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}

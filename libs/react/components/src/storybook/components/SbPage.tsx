import { PropsWithChildren } from 'react';
import { mergeCss } from '../../utils';

type TProps = PropsWithChildren<{
  className?: string;
}>;

export function SbPage(props: TProps) {
  const { children, className } = props;

  const parentCss = [
    'w-full',
    'h-full',
    'p-8',
    'bg-white',
    'flex',
    'grow',
    'gap-8',
    'justify-center',
    className,
  ];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}

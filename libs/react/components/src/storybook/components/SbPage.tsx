import { PropsWithChildren } from 'react';
import { mergeCss } from '../../utils';

type TProps = PropsWithChildren<{
  className?: string;
}>;

export function SbPage(props: TProps) {
  const { children, className } = props;

  const parentCss = [
    'w-full',
    'h-screen',
    'p-8',
    'bg-white',
    'border-4',
    'border-slate-50',
    'flex',
    'flex-col',
    'gap-8',
    className,
  ];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}

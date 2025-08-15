import { mergeCss } from '@monorepo/react/components';
import { PropsWithChildren } from 'react';

type TProps = PropsWithChildren<{
  className?: string;
}>;

export function SbkPage(props: TProps) {
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
    'border-4 border-red-500',
    className,
  ];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}

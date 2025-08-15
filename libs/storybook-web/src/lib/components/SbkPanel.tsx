import { mergeCss } from '@monorepo/react/components';
import { PropsWithChildren } from 'react';

type TVariant = 'bordered';

type TProps = PropsWithChildren<{
  className?: string;
  variant?: TVariant;
}>;

export function SbkPanel(props: TProps) {
  const { children, variant, className } = props;

  const parentCss = [
    'w-full',
    'h-full',
    'p-8',
    'bg-white',
    'flex',
    'grow',
    'gap-8',
    'justify-center',
    variant === 'bordered'
      ? 'border-2 border-dotted border-gray-200 p-8'
      : undefined,
    className,
  ];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}

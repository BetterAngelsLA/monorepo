import { mergeCss } from '@monorepo/react/shared';
import { PropsWithChildren } from 'react';

type TVariant = 'basic' | 'component';

export type TSbkPanelProps = PropsWithChildren<{
  className?: string;
  variant?: TVariant;
  style?: React.CSSProperties;
  withBorder?: boolean;
}>;

export function SbkPanel(props: TSbkPanelProps) {
  const {
    children,
    variant = 'component',
    style,
    withBorder,
    className,
  } = props;

  const borderCss = 'border-2 border-dotted border-gray-200';

  const componentVariantCss = ['w-[360px]', borderCss];

  const parentCss = [
    'w-full',
    'h-full',
    'p-12',
    'bg-white',
    'flex',
    'gap-8',
    'justify-center',
    variant === 'component' ? componentVariantCss : undefined,
    withBorder ? borderCss : undefined,
    className,
  ];

  return (
    <div className={mergeCss(parentCss)} style={style}>
      {children}
    </div>
  );
}

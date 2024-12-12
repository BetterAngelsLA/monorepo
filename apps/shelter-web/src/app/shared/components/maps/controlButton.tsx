import { PropsWithChildren } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';

interface TProps extends PropsWithChildren {
  className?: string;
  onClick: () => void;
}

export function ControlButton(props: TProps) {
  const { onClick, children, className } = props;

  const parentCss = [
    'w-10',
    'h-10',
    'bg-white',
    'border',
    'border-neutral-90',
    'rounded-lg',
    'flex',
    'items-center',
    'justify-center',
    'text-neutral-40',
    'text-2xl',
    className,
  ];

  return (
    <button onClick={onClick} className={mergeCss(parentCss)}>
      {children}
    </button>
  );
}

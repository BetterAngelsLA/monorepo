import { PropsWithChildren } from 'react';
import { mergeCss } from '../../../utils/styles/mergeCss';

interface TProps extends PropsWithChildren {
  className?: string;
  onClick: () => void;
}

export function MapControlBtn(props: TProps) {
  const { onClick, children, className } = props;

  const parentCss = [
    'w-10',
    'h-10',
    'flex',
    'items-center',
    'justify-center',
    'bg-white',
    'border',
    'border-neutral-90',
    'rounded-lg',
    className,
  ];

  return (
    <button onClick={onClick} className={mergeCss(parentCss)}>
      {children}
    </button>
  );
}

import { MouseEventHandler, PropsWithChildren } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';

interface IProps extends PropsWithChildren {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  onClick: MouseEventHandler;
  size?: 'small' | 'normal';
}

export function Button(props: IProps) {
  const {
    ariaLabel,
    className,
    onClick,
    disabled,
    children,
    size = 'normal',
  } = props;

  const sizes = {
    small: 'py-1 px-7',
    normal: 'py-4 px-24',
  };

  const parentCss = [
    'flex',
    'disabled:opacity-80',
    'justify-center',
    'items-center',
    'rounded-full',
    'border-2',
    'font-bold',
    sizes[size],
    className,
  ];

  return (
    <button
      aria-label={ariaLabel}
      className={mergeCss(parentCss)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

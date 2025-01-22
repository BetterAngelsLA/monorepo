import { MouseEventHandler, PropsWithChildren } from 'react';
import { mergeCss } from '../../utils/styles/mergeCss';

interface IProps extends PropsWithChildren {
  className?: string;
  disabled?: boolean;
  onClick: MouseEventHandler;
}

export function Button(props: IProps) {
  const { className, onClick, disabled, children } = props;

  const parentCss = [
    'flex',
    'disabled:opacity-80',
    'justify-center',
    'items-center',
    className,
  ];

  return (
    <button
      className={mergeCss(parentCss)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

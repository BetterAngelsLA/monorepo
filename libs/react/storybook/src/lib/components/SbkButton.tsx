import { mergeCss } from '@monorepo/react/components';
import { ReactNode } from 'react';

type TProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function SbkButton(props: TProps) {
  const { onClick, children, className } = props;

  const parentCss = ['bg-gray-500', 'p-2', 'rounded', 'text-white', className];

  return (
    <button className={mergeCss(parentCss)} onClick={onClick}>
      {children}
    </button>
  );
}

import { ReactNode } from 'react';
import { mergeCss } from '../../utils';

type TProps = {
  children: ReactNode;
  classname?: string;
  onClick?: () => void;
};

export function SbButton(props: TProps) {
  const { onClick, children, classname } = props;

  const parentCss = ['bg-gray-500', 'p-2', 'rounded', 'text-white', classname];

  return (
    <button className={mergeCss(parentCss)} onClick={onClick}>
      {children}
    </button>
  );
}

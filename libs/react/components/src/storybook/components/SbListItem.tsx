import { ReactNode } from 'react';
import { mergeCss } from '../../utils';

type TProps = {
  children: ReactNode;
  className?: string;
};

export function SbListItem(props: TProps) {
  const { children, className } = props;

  const parentCss = [className];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}

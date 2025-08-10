import { ReactNode } from 'react';
import { mergeCss } from '../../utils';

type TProps = {
  children: ReactNode;
  classname?: string;
};

export function SbListItem(props: TProps) {
  const { children, classname } = props;

  const parentCss = [classname];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}

import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

type TProps = {
  className?: string;
  children: ReactNode;
};

export function SectionHeader(props: TProps) {
  const { className, children } = props;

  const parentCss = ['flex'];

  return <div className={mergeCss([parentCss, className])}>{children}</div>;
}

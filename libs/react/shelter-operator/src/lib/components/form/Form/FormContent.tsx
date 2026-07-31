import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

type TProps = {
  className?: string;
  children: ReactNode;
};

export function FormContent(props: TProps) {
  const { className, children } = props;

  const parentCss = ['flex', 'flex-col', 'gap-10'];

  return <div className={mergeCss([parentCss, className])}>{children}</div>;
}

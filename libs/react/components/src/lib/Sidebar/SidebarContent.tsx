import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

type TProps = {
  className?: string;
  children?: ReactNode;
};

export function SidebarContent(props: TProps) {
  const { className, children } = props;

  const parentCss = ['h-full', 'flex', 'flex-col', 'gap-2', className];

  return <div className={mergeCss(parentCss)}>{children}</div>;
}

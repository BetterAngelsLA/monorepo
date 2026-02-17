import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

type TProps = {
  className?: string;
  children: ReactNode;
};

export function SidebarHeader(props: TProps) {
  const { className, children } = props;

  const parentCss = ['flex', 'w-full', 'mb-8', className];

  const headerContentCss = ['flex', 'flex-row'];

  return (
    <div className={mergeCss(parentCss)}>
      <div className={mergeCss(headerContentCss)}>{children}</div>
    </div>
  );
}

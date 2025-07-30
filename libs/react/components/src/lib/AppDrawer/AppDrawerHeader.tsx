import { PropsWithChildren } from 'react';

import { mergeCss } from '@monorepo/react/components';
import { CloseIcon } from '@monorepo/react/icons';

interface IProps extends PropsWithChildren {
  onClick: () => void;
  className?: string;
}

export function AppDrawerHeader(props: IProps) {
  const { onClick, className, children } = props;

  const parentCss = [
    'flex',
    'py-4',
    'px-6',
    'border-b',
    'border-neutral-90',
    className,
  ];

  const iconCss = ['h-6', 'ml-auto', 'cursor-pointer'];

  return (
    <div className={mergeCss(parentCss)}>
      {children}
      <CloseIcon className={mergeCss(iconCss)} onClick={onClick} />
    </div>
  );
}

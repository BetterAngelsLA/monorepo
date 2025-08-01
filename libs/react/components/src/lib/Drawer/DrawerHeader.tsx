import { PropsWithChildren } from 'react';

import { mergeCss } from '@monorepo/react/components';
import { CloseIcon } from '@monorepo/react/icons';
import { useDrawer } from './DrawerProvider/useDrawer';

interface IProps extends PropsWithChildren {
  className?: string;
}

export function DrawerHeader(props: IProps) {
  const { className, children } = props;

  const { closeDrawer } = useDrawer();

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
      <CloseIcon className={mergeCss(iconCss)} onClick={closeDrawer} />
    </div>
  );
}

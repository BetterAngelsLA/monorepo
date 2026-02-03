import { PropsWithChildren } from 'react';

import { mergeCss } from '../../utils';
import { CloseIcon } from '@monorepo/react/icons';
import { useAppDrawer } from './state/useAppDrawer';

interface IProps extends PropsWithChildren {
  className?: string;
}

export function AppDrawerHeader(props: IProps) {
  const { className, children } = props;

  const { closeDrawer } = useAppDrawer();

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

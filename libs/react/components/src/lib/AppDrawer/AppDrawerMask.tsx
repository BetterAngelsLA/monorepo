import { MouseEvent, PropsWithChildren } from 'react';

import { mergeCss } from '@monorepo/react/components';
import { ANIMATION_FADE } from './constants';

interface IProps extends PropsWithChildren {
  visible: boolean;
  className?: string;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
}

export function AppDrawerMask(props: IProps) {
  const { visible, className, onClick, children } = props;

  const parentCss = [
    'z-[90000001]',
    'top-0',
    'left-0',
    'right-0',
    'bottom-0',
    'fixed',
    'flex',
    'bg-black/60',
    visible ? ANIMATION_FADE.IN : ANIMATION_FADE.OUT,
    className,
  ];

  return (
    <div className={mergeCss(parentCss)} onClick={onClick}>
      {children}
    </div>
  );
}

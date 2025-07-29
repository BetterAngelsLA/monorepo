import { MouseEvent, PropsWithChildren } from 'react';

import { mergeCss } from '@monorepo/react/components';
import { useAppDrawerState } from '../../state';

interface IProps extends PropsWithChildren {
  visible: boolean;
  className?: string;
}

export function AppDrawerMask(props: IProps) {
  const { visible, className, children } = props;

  const [_drawer, setDrawer] = useAppDrawerState();

  const parentCss = [
    'z-[90000001]',
    'top-0',
    'left-0',
    'right-0',
    'bottom-0',
    'fixed',
    'flex',
    'bg-black/60',
    visible ? 'animate-fadeIn300' : 'animate-fadeOut300',
    className,
  ];

  function onMaskClick(e: MouseEvent<HTMLDivElement>) {
    if (e) {
      e.stopPropagation();
    }

    setDrawer(null);
  }

  return (
    <div className={mergeCss(parentCss)} onClick={onMaskClick}>
      {children}
    </div>
  );
}

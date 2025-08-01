/** Global Drawer component
 *
 * #### Usage ####
 *
 * 1. include <DrawerProvider /> in App
 * 2. Use `showDrawer` from `useDrawer` hook:
 *
 *   const { showDrawer } = useDrawer();
 *
 *   showDrawer({
 *      content: 'Hello drawer',
 *      placement: 'left', // defaults to right
 *    });
 * */

import {
  MouseEvent,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { mergeCss } from '../../utils';
import { DrawerFooter } from './DrawerFooter';
import { DrawerHeader } from './DrawerHeader';
import { DrawerMask } from './DrawerMask';
import { useDrawer } from './DrawerProvider/useDrawer';
import { CLOSE_ANIMATION_TIMING, DRAWER_ANIMATION } from './constants';

export interface IProps extends PropsWithChildren {
  className?: string;
  maskCss?: string;
}

export function Drawer(props: IProps): ReactElement | null {
  const { className, maskCss } = props;

  const location = useLocation();
  const { drawer, closeDrawer } = useDrawer();
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(!!drawer);
  const [placement, setPlacement] = useState<'left' | 'right'>('right');

  // destroy Drawer if change page
  useEffect((): void => {
    closeDrawer();
  }, [location.pathname]);

  useEffect(() => {
    if (!drawer?.visible) {
      setVisible(false);

      return;
    }

    const placement = drawer.placement ?? 'right';
    setShouldRender(true);
    setPlacement(placement);
    requestAnimationFrame(() => setVisible(true)); // open with animation
  }, [drawer]);

  // Unmount and clean up atom cleanup after hide animation completes
  useEffect(() => {
    if (!visible && shouldRender) {
      const timeout = setTimeout(() => {
        setShouldRender(false);
        closeDrawer();
      }, CLOSE_ANIMATION_TIMING);

      return () => clearTimeout(timeout);
    }

    return;
  }, [visible, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  function handleMaskClick(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation();

    closeDrawer();
  }

  const { content, header, footer, contentClassName } = drawer!;

  const animation = DRAWER_ANIMATION[placement];

  const parentCss = [
    'flex',
    'flex-col',
    'h-full',
    'w-[500px]',
    'bg-white',
    visible ? animation.SHOW : animation.HIDE,
    placement === 'left' ? 'mr-auto' : 'ml-auto',
    'shadow-xl',
    className,
  ];

  const contentCss = ['h-full', 'p-6', 'overflow-y-auto', contentClassName];

  return (
    <DrawerMask visible={visible} onClick={handleMaskClick} className={maskCss}>
      <div onClick={(e) => e.stopPropagation()} className={mergeCss(parentCss)}>
        {header && <DrawerHeader>{header}</DrawerHeader>}

        <div className={mergeCss(contentCss)}>{content}</div>

        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </div>
    </DrawerMask>
  );
}

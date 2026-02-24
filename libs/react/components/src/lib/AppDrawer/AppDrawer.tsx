/** Global Drawer component
 *
 * #### Usage ####
 *
 * 1. include <AppDrawer /> in App layout
 * 2. Use `showDrawer` from `useAppDrawer` hook:
 *
 *   const { showDrawer } = useAppDrawer();
 *
 *   showDrawer({
 *      content: 'Hello drawer',
 *      placement: 'left', // defaults to right
 *    });
 * */

import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import {
  MouseEvent,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { AppDrawerFooter } from './AppDrawerFooter';
import { AppDrawerHeader } from './AppDrawerHeader';
import { AppDrawerMask } from './AppDrawerMask';
import { CLOSE_ANIMATION_TIMING, DRAWER_ANIMATION } from './constants';
import { appDrawerAtom } from './state/appDrawerAtom';

export interface IProps extends PropsWithChildren {
  className?: string;
  maskCss?: string;
}

export function AppDrawer(props: IProps): ReactElement | null {
  const { className, maskCss } = props;

  const location = useLocation();
  const [drawer, setDrawer] = useAtom(appDrawerAtom);
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(!!drawer);
  const [placement, setPlacement] = useState<'left' | 'right'>('right');

  // destroy Drawer if change page
  useEffect((): void => {
    setDrawer(null);
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
        setDrawer(null);
      }, CLOSE_ANIMATION_TIMING);

      return () => clearTimeout(timeout);
    }

    return;
  }, [visible, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  function handleClose() {
    setDrawer((prev) => {
      if (!prev) {
        return null;
      }

      return { ...prev, visible: false };
    });
  }

  function handleMaskClick(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation();

    handleClose();
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
    <AppDrawerMask
      visible={visible}
      onClick={handleMaskClick}
      className={maskCss}
    >
      <div onClick={(e) => e.stopPropagation()} className={mergeCss(parentCss)}>
        {header && <AppDrawerHeader>{header}</AppDrawerHeader>}

        <div className={mergeCss(contentCss)}>{content}</div>

        {footer && <AppDrawerFooter>{footer}</AppDrawerFooter>}
      </div>
    </AppDrawerMask>
  );
}

AppDrawer.Header = AppDrawerHeader;
AppDrawer.Footer = AppDrawerFooter;

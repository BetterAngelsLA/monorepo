import { useAtom } from 'jotai';
import {
  MouseEvent,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { mergeCss } from '../../utils';
import { AppDrawerFooter } from './AppDrawerFooter';
import { AppDrawerHeader } from './AppDrawerHeader';
import { AppDrawerMask } from './AppDrawerMask';
import { ANIMATION_TIMING, DRAWER_TRANSITION } from './constants';
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
    if (drawer) {
      const placement = drawer.placement ?? 'right';

      setPlacement(placement);
      setShouldRender(true);
      requestAnimationFrame(() => setVisible(true));

      return;
    }

    setVisible(false);
  }, [drawer]);

  // Unmount and clean up atom cleanup after hide animation completes
  useEffect(() => {
    if (!visible && shouldRender) {
      const timeout = setTimeout(() => {
        setShouldRender(false);
        setDrawer(null);
      }, ANIMATION_TIMING);

      return () => clearTimeout(timeout);
    }

    return;
  }, [visible, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  function handleMaskClick(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation();

    setVisible(false);
  }

  const { content, header, footer, contentClassName } = drawer || {};

  const transitions = DRAWER_TRANSITION[placement];

  const parentCss = [
    'flex',
    'flex-col',
    'h-full',
    'w-[500px]',
    'bg-white',
    visible ? transitions.IN : transitions.OUT,
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
        {header && (
          <AppDrawerHeader onClick={() => setVisible(false)}>
            {header}
          </AppDrawerHeader>
        )}
        <div className={mergeCss(contentCss)}>{content}</div>

        {footer && <AppDrawerFooter>{footer}</AppDrawerFooter>}
      </div>
    </AppDrawerMask>
  );
}

AppDrawer.Header = AppDrawerHeader;

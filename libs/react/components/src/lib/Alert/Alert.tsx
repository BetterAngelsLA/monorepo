import { CloseIcon } from '@monorepo/react/icons';
import { useAtom } from 'jotai';
import { ReactElement, useEffect, useState } from 'react';
import { mergeCss } from '../../utils';
import {
  ANIMATION,
  CLOSE_ANIMATION_TIMING,
  alertConfig,
  zIndex,
} from './constants';
import { alertAtom } from './state/alertAtom';

export function Alert(): ReactElement | null {
  const [alert, setAlert] = useAtom(alertAtom);
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(!!alert);

  useEffect(() => {
    if (!alert?.visible) {
      setVisible(false);

      return;
    }

    setShouldRender(true);
    requestAnimationFrame(() => setVisible(true)); // open with animation
  }, [alert]);

  // Unmount and clean up atom cleanup after hide animation completes
  useEffect(() => {
    if (!visible && shouldRender) {
      const timeout = setTimeout(() => {
        setShouldRender(false);
        setAlert(null);
      }, CLOSE_ANIMATION_TIMING);

      return () => clearTimeout(timeout);
    }

    return;
  }, [visible, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  function handleClose() {
    console.log('################################### CLOSE');
    setAlert((prev) => {
      if (!prev) {
        return null;
      }

      return { ...prev, visible: false };
    });
  }

  const { content, type } = alert!;
  const { color, icon } = alertConfig[type];

  const parentCss = [
    'fixed',
    'top-6',
    'left-1/2',
    `z-[${zIndex}]`,
    'pointer-events-none',
  ];

  const innerWrapperCss = ['transform', '-translate-x-1/2'];

  const contentCss = [
    visible ? ANIMATION.SHOW : ANIMATION.HIDE,
    'text-white',
    'px-4',
    'py-3',
    'rounded-2xl',
    'shadow-lg',
    'w-fit',
    'max-w-[60vw]',
    'flex',
    'justify-center',
  ];

  const closeBtnCss = [
    'flex',
    'w-6',
    'h-6',
    'ml-auto',
    'items-center',
    'justify-center',
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <div className={mergeCss(innerWrapperCss)}>
        <div
          className={mergeCss(contentCss)}
          style={{ backgroundColor: color }}
        >
          {content}

          <button className={mergeCss(closeBtnCss)} onClick={handleClose}>
            <CloseIcon className="h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

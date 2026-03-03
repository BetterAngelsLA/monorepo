import { useLayoutEffect, useState, type RefObject } from 'react';
import { MENU_GAP } from './constants';

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

/**
 * Tracks the screen position of a trigger element so a portal-rendered menu
 * can be placed directly below it. Re-measures on scroll and resize via
 * `requestAnimationFrame` to stay in sync without jank.
 */
export function usePortalPosition(
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean
): MenuPosition {
  const [pos, setPos] = useState<MenuPosition>({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    let rafId = 0;

    const measure = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + MENU_GAP,
        left: rect.left,
        width: rect.width,
      });
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    // Measure immediately (layout effect — before paint).
    measure();

    // Re-measure when the page scrolls or the window resizes.
    window.addEventListener('scroll', scheduleMeasure, true);
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleMeasure, true);
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [isOpen, triggerRef]);

  return pos;
}

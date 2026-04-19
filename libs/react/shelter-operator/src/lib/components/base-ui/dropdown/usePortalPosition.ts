import { useLayoutEffect, useState, type RefObject } from 'react';
import { MENU_GAP } from './constants';

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const VIEWPORT_PADDING = 12;
const MIN_MENU_HEIGHT = 220;

/**
 * Keeps a portal-rendered menu aligned below an anchor element using
 * `getBoundingClientRect()` (typically the trigger row plus any fields below it,
 * e.g. the “Other” detail input).
 *
 * While the menu is open, a `ResizeObserver` on that element reapplies the
 * measurement when its height changes, so the menu stays under the bottom edge.
 *
 * Closes the menu if the user scrolls (outside the menu itself) or resizes
 * the window, since repositioning on every scroll frame causes visible jitter.
 */
export function usePortalPosition(
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
  menuRef: RefObject<HTMLElement | null>
): MenuPosition {
  const [pos, setPos] = useState<MenuPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: MIN_MENU_HEIGHT,
  });

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const el = triggerRef.current;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const preferredTop = rect.bottom + MENU_GAP;
      const availableBelow = viewportHeight - preferredTop - VIEWPORT_PADDING;
      const availableAbove = rect.top - MENU_GAP - VIEWPORT_PADDING;

      const canOpenAbove =
        availableBelow < MIN_MENU_HEIGHT && availableAbove > availableBelow;

      const maxHeight = Math.max(
        120,
        canOpenAbove ? availableAbove : availableBelow
      );

      const top = canOpenAbove
        ? Math.max(VIEWPORT_PADDING, rect.top - MENU_GAP - maxHeight)
        : Math.max(
            VIEWPORT_PADDING,
            Math.min(
              preferredTop,
              viewportHeight - VIEWPORT_PADDING - maxHeight
            )
          );

      setPos({
        top,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [isOpen, triggerRef]);

  // Close on external scroll or window resize.
  useLayoutEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e: Event) => {
      // Don't close when the user scrolls inside the dropdown menu itself.
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    };

    const handleResize = () => onClose();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, onClose, menuRef]);

  return pos;
}

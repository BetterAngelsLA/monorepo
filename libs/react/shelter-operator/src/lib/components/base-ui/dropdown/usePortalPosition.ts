import { useLayoutEffect, useState, type RefObject } from 'react';
import { MENU_GAP } from './constants';

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

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
  const [pos, setPos] = useState<MenuPosition>({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const el = triggerRef.current;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setPos({
        top: rect.bottom + MENU_GAP,
        left: rect.left,
        width: rect.width,
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

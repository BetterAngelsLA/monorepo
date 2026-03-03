import { useLayoutEffect, useState, type RefObject } from 'react';
import { MENU_GAP } from './constants';

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

/**
 * Measures the screen position of a trigger element once when the menu opens
 * so a portal-rendered menu can be placed directly below it.
 *
 * Closes the menu if the user scrolls (outside the menu itself) or resizes,
 * since repositioning on every scroll frame causes visible jitter.
 */
export function usePortalPosition(
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
  menuRef: RefObject<HTMLElement | null>
): MenuPosition {
  const [pos, setPos] = useState<MenuPosition>({ top: 0, left: 0, width: 0 });

  // Measure once when the menu opens.
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + MENU_GAP,
      left: rect.left,
      width: rect.width,
    });
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

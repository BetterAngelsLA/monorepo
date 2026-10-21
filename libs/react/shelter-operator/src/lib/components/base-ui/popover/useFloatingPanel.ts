import { useLayoutEffect, useState, type RefObject } from 'react';
import {
  computePanelPlacement,
  type PanelPlacement,
} from './computePanelPlacement';

export interface UseFloatingPanelOptions {
  /** Space between the anchor and the panel. */
  gap?: number;
  /** Minimum distance from the viewport edges. */
  margin?: number;
  /**
   * Called when the page scrolls outside the panel or the window resizes. The
   * panel is `position: fixed`, so it would otherwise detach from its anchor.
   */
  onClose?: () => void;
}

const DEFAULT_GAP = 6;
const DEFAULT_MARGIN = 8;

/**
 * Keep a fixed-position panel attached to its anchor inside the viewport.
 *
 * Measures the anchor and the panel, then computes a left/top that clamps to
 * the viewport and flips above the anchor when there is not enough room below.
 * Re-measures when either element resizes (content change, scrollbar appearing,
 * the anchor growing).
 *
 * Pass `onClose` to dismiss the panel on an external scroll or a window resize;
 * scrolling *inside* the panel is ignored.
 */
export function useFloatingPanel(
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  open: boolean,
  {
    gap = DEFAULT_GAP,
    margin = DEFAULT_MARGIN,
    onClose,
  }: UseFloatingPanelOptions = {},
): PanelPlacement | null {
  const [placement, setPlacement] = useState<PanelPlacement | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const measure = () => {
      const panelRect = panel.getBoundingClientRect();
      const next = computePanelPlacement(
        anchor.getBoundingClientRect(),
        { width: panelRect.width, height: panelRect.height },
        { width: window.innerWidth, height: window.innerHeight },
        { gap, margin },
      );
      setPlacement((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.placement === next.placement
          ? prev
          : next,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(anchor);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [open, anchorRef, panelRef, gap, margin]);

  useLayoutEffect(() => {
    if (!open || !onClose) return;

    const handleScroll = (event: Event) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const handleResize = () => onClose();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, onClose, panelRef]);

  return placement;
}

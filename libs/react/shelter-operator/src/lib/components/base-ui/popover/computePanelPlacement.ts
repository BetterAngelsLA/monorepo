export interface RectLike {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface PlacementOptions {
  /** Space between the anchor and the panel. */
  gap: number;
  /** Minimum distance from the viewport edges. */
  margin: number;
}

export interface PanelPlacement {
  top: number;
  left: number;
  /** Whether the panel ended up below or above its anchor. */
  placement: 'above' | 'below';
}

/**
 * Fit a fixed-position panel next to its anchor.
 *
 * Horizontally the panel aligns to the anchor's left edge, then clamps inside
 * the viewport (including when the anchor is partly off-screen). Vertically it
 * prefers below the anchor, flips above when there is more room there, and
 * finally clamps so a panel taller than the viewport starts at the margin.
 *
 * Pure so the geometry can be tested without a DOM layout.
 */
export function computePanelPlacement(
  anchor: RectLike,
  panel: Size,
  viewport: Size,
  { gap, margin }: PlacementOptions,
): PanelPlacement {
  const maxLeft = Math.max(margin, viewport.width - panel.width - margin);
  const left = Math.max(margin, Math.min(anchor.left, maxLeft));

  const spaceBelow = viewport.height - anchor.bottom - gap;
  const spaceAbove = anchor.top - gap;
  const placeAbove = panel.height > spaceBelow && spaceAbove > spaceBelow;

  const preferredTop = placeAbove
    ? anchor.top - panel.height - gap
    : anchor.bottom + gap;
  const top = Math.max(
    margin,
    Math.min(preferredTop, viewport.height - panel.height - margin),
  );

  return { top, left, placement: placeAbove ? 'above' : 'below' };
}

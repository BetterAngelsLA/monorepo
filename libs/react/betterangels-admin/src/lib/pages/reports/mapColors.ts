/**
 * Colour maths shared by the two canvas layers.
 *
 * `RegionMap` and `PointLayer` both read their colours from antd design tokens, which arrive
 * as either `#rrggbb` or `rgb(r, g, b)` depending on the token — and the canvas 2D context
 * needs components to interpolate between them (the choropleth ramp) or to apply an alpha to
 * (the cluster marks).
 *
 * These lived as identical private copies in both files. Two copies of a parser is two places
 * for the same edge case to be fixed once and not the other, so they live here instead.
 */

/** Parse `#rrggbb` or `rgb(r,g,b)` into components; antd tokens come as either. */
export function parseColor(color: string): [number, number, number] {
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }
  // A token we cannot read (a CSS var, say) — a mid grey keeps the map legible rather than
  // throwing away the whole overlay.
  return [128, 128, 128];
}

/** A token with an alpha applied, whether it arrives as hex or as `rgb()`. */
export function withAlpha(color: string, alpha: number): string {
  const [r, g, b] = parseColor(color);
  return `rgba(${r},${g},${b},${alpha})`;
}

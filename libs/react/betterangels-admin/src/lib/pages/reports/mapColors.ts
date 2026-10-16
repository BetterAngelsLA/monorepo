/**
 * Colour maths for the map's deck.gl layers.
 *
 * `DeckMapLayers` reads its colours from antd design tokens, which arrive as either `#rrggbb`
 * or `rgb(r, g, b)` depending on the token, and the density ramp interpolates between stops.
 * deck.gl is WebGL, so both need `[r, g, b]` component arrays rather than CSS strings —
 * `parseColor` produces one from a token, `lerpRgb` blends two.
 */

/** An 8-bit RGB triple, as the layer colours and the ramp tables both want it. */
export type Rgb = [number, number, number];

/** Parse `#rrggbb` or `rgb(r,g,b)` into components; antd tokens come as either. */
export function parseColor(color: string): Rgb {
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

/** Linear blend between two colour components. */
function lerpChannel(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t);
}

/** Blend two parsed colours by `t` (0 = `from`, 1 = `to`). */
export function lerpRgb(from: Rgb, to: Rgb, t: number): Rgb {
  return [
    lerpChannel(from[0], to[0], t),
    lerpChannel(from[1], to[1], t),
    lerpChannel(from[2], to[2], t),
  ];
}

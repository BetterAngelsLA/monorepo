/**
 * The heatmap's colour ramp, separated from the painting.
 *
 * The ramp lives here so the map and its legend cannot disagree: `RAMP` is what the layer
 * paints with and `HEATMAP_RAMP_CSS` is derived from the same stops, because a key
 * maintained separately is a second source of truth, and a key describing colours the map no
 * longer produces is worse than no key at all.
 *
 * The *scale* is not here. It used to be: a reference peak was computed per zoom from a
 * quartic kernel, to keep the colours from changing as you panned. That predated the move to
 * deck.gl's `HeatmapLayer`, which derives its domain from the dataset — so the hand-computed
 * reference was not on the same scale as what drew, and it flattened the whole field to the
 * cold end of the ramp. Removed, and verified: panning the dense area out of view drops the
 * warm share rather than promoting whatever is left to red, so the colours do not swim.
 */

import { type Rgb } from './mapColors';

/** One stop on the colour ramp: a normalised intensity and the colour it maps to. */
type RampStop = { stop: number; color: Rgb };

/** Blue through cyan, green and yellow to red, as normalised intensity. */
export const RAMP: RampStop[] = [
  { stop: 0.0, color: [40, 60, 200] },
  { stop: 0.3, color: [0, 190, 255] },
  { stop: 0.5, color: [0, 210, 90] },
  { stop: 0.72, color: [255, 216, 0] },
  { stop: 1.0, color: [220, 30, 20] },
];

/** The ramp as a CSS gradient, for the legend. */
export const HEATMAP_RAMP_CSS = `linear-gradient(to right, ${RAMP.map(
  ({ stop, color }) => `rgb(${color.join(',')}) ${(stop * 100).toFixed(0)}%`,
).join(', ')})`;

/**
 * The kernel's radius, in pixels.
 *
 * A reference radius rather than a per-zoom table: deck.gl scales the kernel with zoom
 * itself. Measured against the real 10,000-point dataset, where the density field reads
 * correctly at this size.
 */
export const HEATMAP_RADIUS_PX = 60;

/** One interaction location, as the layers hand it around. */
export type HeatPoint = { latitude: number; longitude: number };

/**
 * The density grid's colour ramp, separated from the painting.
 *
 * The ramp lives here so the map and its legend cannot disagree: `RAMP` is what the layer
 * paints with and `HEATMAP_RAMP_CSS` is derived from the same stops, because a key
 * maintained separately is a second source of truth, and a key describing colours the map no
 * longer produces is worse than no key at all.
 *
 * **The scale is density, not a raw cell count.** One server cell covers four times the ground
 * for each zoom step out, so a count per cell is not comparable across zooms: the same
 * neighbourhood reads four times hotter one step out and saturates at the county view. Dividing
 * the count by the cell's area makes the colour mean *interactions per km²* at every zoom. The
 * cell size still changes — the legend states it — but the colour no longer does.
 */

import { lerpRgb, type Rgb } from './mapColors';

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
 * Interactions per km² at which the ramp reaches red.
 *
 * Measured at the zoom the map opens at: the peak cell held 50 interactions in a cell about
 * 2.0 km square (~4.1 km²), i.e. ~12 per km². Because the colour is now density, this one
 * number works at every zoom; the legend's cell-size line explains how big the squares are.
 */
export const DENSITY_PER_KM2_MAX = 12;

/**
 * Grid cells per tile, mirroring `DENSITY_CELLS_PER_TILE` in the backend's `tiles.py`.
 *
 * The client needs it to turn a tile zoom into a cell area. Changing the server's grid changes
 * what a cell means; update this with it or the legend and colours silently disagree.
 */
export const DENSITY_CELLS_PER_TILE = 64;

const EARTH_CIRCUMFERENCE_M = 40_075_016.686;

/** A tile's ground width in metres, for a Web Mercator tile at *zoom* and *latitude*. */
function tileWidthMeters(tileZoom: number, latitude: number): number {
  return (
    (EARTH_CIRCUMFERENCE_M * Math.cos((latitude * Math.PI) / 180)) /
    2 ** tileZoom
  );
}

/** One cell's ground width in metres. */
export function densityCellSideMeters(
  tileZoom: number,
  latitude: number,
): number {
  return tileWidthMeters(tileZoom, latitude) / DENSITY_CELLS_PER_TILE;
}

/** One cell's ground area in km²; the divisor that makes the colour a density. */
export function densityCellAreaKm2(tileZoom: number, latitude: number): number {
  return densityCellSideMeters(tileZoom, latitude) ** 2 / 1_000_000;
}

/** One interaction location, as the layers hand it around. */
export type HeatPoint = { latitude: number; longitude: number };

/** The ramp's colour at a normalised intensity, interpolating between its two nearest stops. */
export function rampAt(intensity: number): Rgb {
  const t = Math.min(1, Math.max(0, intensity));
  for (let i = 1; i < RAMP.length; i += 1) {
    const previous = RAMP[i - 1];
    const next = RAMP[i];
    if (t <= next.stop) {
      const span = next.stop - previous.stop;
      const local = span > 0 ? (t - previous.stop) / span : 0;
      return lerpRgb(previous.color, next.color, local);
    }
  }
  return RAMP[RAMP.length - 1].color;
}

/**
 * A cell's fill, as deck.gl wants it: `[r, g, b, a]`, each channel 0-255.
 *
 * The square root is what makes the low end readable. Densities are heavy-tailed — most cells
 * hold a modest density and a few hold the peak — so a linear map puts almost every cell in the
 * cold third of the ramp and the map reads as blank. `sqrt` spreads the common values across
 * the middle without changing which cells are hottest.
 *
 * The alpha is constant: cells tile the plane without overlapping, so there is nothing for a
 * variable alpha to say, and a constant one keeps the colour a function of density alone.
 */
export function densityColor(
  count: number,
  cellAreaKm2: number,
): [number, number, number, number] {
  // A missing or malformed `count` property reaches here as `NaN`, and `NaN` compares false
  // against every stop — which would fall through the loop to the *hottest* colour. Fail to
  // the cold end instead: an unreadable cell should read as empty, not as the peak.
  const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
  const area = Number.isFinite(cellAreaKm2) ? Math.max(cellAreaKm2, 1e-6) : 1;
  const intensity = Math.sqrt(safeCount / area / DENSITY_PER_KM2_MAX);
  const [r, g, b] = rampAt(intensity);
  return [r, g, b, 216];
}

/**
 * The density grid's colour ramp, separated from the painting.
 *
 * The ramp lives here so the map and its legend cannot disagree: `RAMP` is what the layer
 * paints with and `HEATMAP_RAMP_CSS` is derived from the same stops, because a key
 * maintained separately is a second source of truth, and a key describing colours the map no
 * longer produces is worse than no key at all.
 *
 * **The scale is density, not a raw cell count.** One server cell covers four times the ground
 * for each zoom step out, so a count per cell is not comparable across zooms. Dividing the count
 * by the cell's area makes the colour mean *interactions per km²*; the live domain is then the
 * p95 of those densities at the current zoom, so the ramp is full at every zoom but the colours
 * are relative to it, not comparable across zooms. The legend states both.
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
 * Fallback interactions per km² at which the ramp reaches red.
 *
 * The live domain is the 95th percentile of the non-empty cells at the current zoom, from
 * `densityScale`. This fixed value only covers the moment before that answer arrives (and a
 * failed scale request); 18 reflects the county view's upper range and leaves the street grid
 * a usable spread.
 */
export const DENSITY_PER_KM2_MAX = 18;

/**
 * Grid cells per tile, as a target ground size rather than a fixed count.
 *
 * The ~500 m cell is the density estimate's resolution floor: at this volume a 500 m cell
 * holds ~3 interactions typically, while a 127 m cell holds ~1, so shrinking further turns the
 * heatmap into a binary occupied/not map and makes the percentile domain describe noise.
 * The 64-cell cap is the separate county-view payload cap; above tile zoom 10 the floor holds
 * a constant ~500 m cell, below it the cap makes cells 1–4 km.
 *
 * This must match `density_cells_per_tile` in the backend's `grid.py`; the colour divides by
 * the same area the server counted over. The reference latitude is LA's, so the two agree
 * exactly across the county (the true ground size varies by ~1.5%).
 */
const DENSITY_TARGET_CELL_M = 500;
const DENSITY_MAX_CELLS_PER_TILE = 64;
const DENSITY_REFERENCE_LATITUDE = 34.05;

const EARTH_CIRCUMFERENCE_M = 40_075_016.686;

/** A tile's ground width in metres, for a Web Mercator tile at *zoom* and *latitude*. */
function tileWidthMeters(tileZoom: number, latitude: number): number {
  return (
    (EARTH_CIRCUMFERENCE_M * Math.cos((latitude * Math.PI) / 180)) /
    2 ** tileZoom
  );
}

/** Cells across one tile at *tileZoom*; see `DENSITY_TARGET_CELL_M`. */
export function densityCellsPerTile(tileZoom: number): number {
  const cells =
    tileWidthMeters(tileZoom, DENSITY_REFERENCE_LATITUDE) /
    DENSITY_TARGET_CELL_M;
  return Math.max(
    1,
    Math.min(DENSITY_MAX_CELLS_PER_TILE, Math.floor(cells + 0.5)),
  );
}

/** One cell's ground width in metres. */
export function densityCellSideMeters(
  tileZoom: number,
  latitude: number,
): number {
  return tileWidthMeters(tileZoom, latitude) / densityCellsPerTile(tileZoom);
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
  densityMax: number = DENSITY_PER_KM2_MAX,
): [number, number, number, number] {
  // A missing or malformed `count` property reaches here as `NaN`, and `NaN` compares false
  // against every stop — which would fall through the loop to the *hottest* colour. Fail to
  // the cold end instead: an unreadable cell should read as empty, not as the peak.
  const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
  const area = Number.isFinite(cellAreaKm2) ? Math.max(cellAreaKm2, 1e-6) : 1;
  // The per-zoom p95 from `densityScale`; the fixed constant is only the fallback while that
  // answer is in flight or absent. A non-positive domain would divide by zero.
  const max =
    Number.isFinite(densityMax) && densityMax > 0
      ? densityMax
      : DENSITY_PER_KM2_MAX;
  const intensity = Math.sqrt(safeCount / area / max);
  const [r, g, b] = rampAt(intensity);
  return [r, g, b, 216];
}

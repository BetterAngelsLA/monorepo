/**
 * The density grid's colour ramp, separated from the painting.
 *
 * The ramp lives here so the map and its legend cannot disagree: `RAMP` is what the layer
 * paints with and `HEATMAP_RAMP_CSS` is derived from the same stops, because a key
 * maintained separately is a second source of truth, and a key describing colours the map no
 * longer produces is worse than no key at all.
 *
 * The *scale* is here too, and it is deliberately **fixed** rather than derived from the
 * data. The layer paints server-aggregated grid cells, one tile at a time, so the client never
 * holds the whole selection's counts and a per-tile maximum would recolour the field at every
 * tile boundary. A fixed reference — `DENSITY_COLOR_MAX` interactions in one cell — is the
 * same wherever the reader looks and whatever they pan to. The trade is that the scale does
 * not follow the zoom: cells get smaller as the reader zooms in, so the same physical density
 * reads cooler. The legend states the absolute numbers, so that is readable rather than
 * hidden.
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
 * Interactions in one cell at which the ramp reaches red.
 *
 * **Measured at the zoom the map opens at**, which is not the zoom a naive reading of the
 * tile URL suggests: deck.gl's tiles are 512 px and Google's zoom levels are 256 px, so a map
 * at Google zoom 9 asks the endpoint for **z8** tiles. Decoded from what the browser actually
 * loaded (LA County, 30-day window): 368 non-empty cells, counts 1 to 52, median 30,
 * ninetieth percentile 40.
 *
 * 50 is chosen so the ramp's range covers that distribution: the peak is red, the median is
 * yellow-orange and the sparse edges are blue, so most of the ramp is visible rather than the
 * field flattening into one red mass.
 *
 * The trade this number makes is deliberate and worth stating: the scale is **fixed**, so it
 * does not follow the zoom. A cell covers four times the ground at each zoom step out, so
 * zooming out past the opening view saturates and zooming in cools. Adapting the reference to
 * the zoom was rejected because the field would then recolour on every zoom tick — the same
 * swimming the ramp's fixed domain was chosen to avoid — and because deck gives a per-tile
 * accessor no tile index to key on without reimplementing the layer.
 */
export const DENSITY_COLOR_MAX = 50;

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
 * The square root is what makes the low end readable. Cell counts are heavy-tailed — most
 * cells hold a handful of interactions and a few hold the peak — so a linear map puts almost
 * every cell in the cold third of the ramp and the map reads as blank. `sqrt` spreads the
 * common values across the middle without changing which cells are hottest.
 *
 * The alpha is constant: cells tile the plane without overlapping, so there is nothing for a
 * variable alpha to say, and a constant one keeps the colour a function of `count` alone.
 */
export function densityColor(count: number): [number, number, number, number] {
  // A missing or malformed `count` property reaches here as `NaN`, and `NaN` compares false
  // against every stop — which would fall through the loop to the *hottest* colour. Fail to
  // the cold end instead: an unreadable cell should read as empty, not as the peak.
  const safe = Number.isFinite(count) ? Math.max(0, count) : 0;
  const intensity = Math.sqrt(safe / DENSITY_COLOR_MAX);
  const [r, g, b] = rampAt(intensity);
  return [r, g, b, 216];
}

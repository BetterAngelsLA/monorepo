import { describe, expect, it } from 'vitest';
import {
  DENSITY_PER_KM2_MAX,
  densityCellAreaKm2,
  densityCellSideMeters,
  densityCellsPerTile,
  densityColor,
  rampAt,
} from './heatmapMath';

/** A cell area in km², used only to compare equal densities across zooms. */
const CELL_KM2 = 4;

describe('densityColor', () => {
  it('paints an empty cell with the cold end of the ramp', () => {
    expect(densityColor(0, CELL_KM2)).toEqual([40, 60, 200, 216]);
  });

  it('reaches the hot end at the reference density', () => {
    expect(densityColor(DENSITY_PER_KM2_MAX * CELL_KM2, CELL_KM2)).toEqual([
      220, 30, 20, 216,
    ]);
  });

  it('clamps above the reference density rather than overflowing the ramp', () => {
    expect(densityColor(DENSITY_PER_KM2_MAX * CELL_KM2 * 10, CELL_KM2)).toEqual(
      densityColor(DENSITY_PER_KM2_MAX * CELL_KM2, CELL_KM2),
    );
  });

  it('gives the same colour to the same density at different cell sizes', () => {
    // The point of the change: 50 interactions in a 4 km² cell and 12.5 in a 1 km² cell are
    // both 12.5/km². Zooming out makes the cell larger, not the place hotter.
    expect(densityColor(50, 4)).toEqual(densityColor(12.5, 1));
  });

  it('treats NaN, Infinity and negative counts as empty', () => {
    // A malformed MVT `count` property reaches here as `NaN`. `NaN` compares false against
    // every ramp stop, so without the guard it would fall through to the *hottest* colour and
    // an unreadable cell would read as the peak.
    expect(densityColor(NaN, CELL_KM2)).toEqual(densityColor(0, CELL_KM2));
    expect(densityColor(-5, CELL_KM2)).toEqual(densityColor(0, CELL_KM2));
    expect(densityColor(Infinity, CELL_KM2)).toEqual(densityColor(0, CELL_KM2));
  });

  it('keeps the alpha constant', () => {
    expect(densityColor(0, CELL_KM2)[3]).toBe(216);
    expect(densityColor(DENSITY_PER_KM2_MAX * CELL_KM2, CELL_KM2)[3]).toBe(216);
    expect(densityColor(NaN, CELL_KM2)[3]).toBe(216);
  });

  it('spreads densities along the ramp by square root, not linearly', () => {
    // sqrt is what keeps the heavy-tailed low end off the cold edge. A linear map — or a
    // missing sqrt — would put the same density at a different point on the ramp and fail here.
    for (const count of [0, 1, 5, 20, 50]) {
      const expected = rampAt(
        Math.sqrt(count / CELL_KM2 / DENSITY_PER_KM2_MAX),
      );
      expect(
        densityColor(count, CELL_KM2).slice(0, 3),
        `count ${count}`,
      ).toEqual(expected);
    }
    expect(densityColor(0, CELL_KM2).slice(0, 3)).not.toEqual(
      densityColor(DENSITY_PER_KM2_MAX * CELL_KM2, CELL_KM2).slice(0, 3),
    );
  });
});

describe('cell geometry', () => {
  it('derives a cell area that quadruples per zoom step out', () => {
    const z8 = densityCellAreaKm2(8, 34.05);
    const z7 = densityCellAreaKm2(7, 34.05);
    const z9 = densityCellAreaKm2(9, 34.05);

    // Opening view: ~2.0 km per side, ~4.1 km². The exact value is only a sanity check.
    expect(densityCellSideMeters(8, 34.05)).toBeCloseTo(2027, 0);
    expect(z8).toBeCloseTo(4.11, 1);
    expect(z7).toBeCloseTo(z8 * 4, 5);
    expect(z9).toBeCloseTo(z8 / 4, 5);
  });

  it('holds a ~500 m cell once the fixed fraction would be too small', () => {
    // The client and server must agree on this list; the backend test asserts the same one.
    expect([8, 9, 10, 11, 12, 13, 14, 15, 16].map(densityCellsPerTile)).toEqual(
      [64, 64, 64, 32, 16, 8, 4, 2, 1],
    );
    for (const zoom of [10, 11, 12, 13, 14, 15, 16]) {
      expect(densityCellSideMeters(zoom, 34.05)).toBeCloseTo(507, 0);
    }
  });
});

describe('rampAt', () => {
  it('clamps outside 0..1', () => {
    expect(rampAt(-1)).toEqual(rampAt(0));
    expect(rampAt(2)).toEqual(rampAt(1));
  });
});

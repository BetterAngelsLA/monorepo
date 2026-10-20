import { describe, expect, it } from 'vitest';
import { DENSITY_COLOR_MAX, densityColor, rampAt } from './heatmapMath';

describe('densityColor', () => {
  it('paints an empty cell with the cold end of the ramp', () => {
    expect(densityColor(0)).toEqual([40, 60, 200, 216]);
  });

  it('reaches the hot end of the ramp at the reference maximum', () => {
    expect(densityColor(DENSITY_COLOR_MAX)).toEqual([220, 30, 20, 216]);
  });

  it('clamps above the reference maximum rather than overflowing the ramp', () => {
    // The scale is fixed, so a cell busier than the reference saturates at red.
    expect(densityColor(DENSITY_COLOR_MAX * 10)).toEqual(
      densityColor(DENSITY_COLOR_MAX),
    );
  });

  it('treats NaN, Infinity and negative counts as empty', () => {
    // A malformed MVT `count` property reaches here as `NaN`. `NaN` compares false against
    // every ramp stop, so without the guard it would fall through to the *hottest* colour and
    // an unreadable cell would read as the peak.
    expect(densityColor(NaN)).toEqual(densityColor(0));
    expect(densityColor(-5)).toEqual(densityColor(0));
    expect(densityColor(Infinity)).toEqual(densityColor(0));
  });

  it('keeps the alpha constant', () => {
    expect(densityColor(0)[3]).toBe(216);
    expect(densityColor(DENSITY_COLOR_MAX)[3]).toBe(216);
    expect(densityColor(NaN)[3]).toBe(216);
  });

  it('spreads counts along the ramp by square root, not linearly', () => {
    // sqrt is what keeps the heavy-tailed low end off the cold edge. A linear map — or a
    // missing sqrt — would put the same count at a different point on the ramp and fail here.
    for (const count of [0, 1, 5, 20, 50]) {
      const expected = rampAt(Math.sqrt(count / DENSITY_COLOR_MAX));
      expect(densityColor(count).slice(0, 3), `count ${count}`).toEqual(
        expected,
      );
    }
    // And the mapping does go cold-to-hot as the count grows.
    expect(densityColor(0).slice(0, 3)).not.toEqual(
      densityColor(DENSITY_COLOR_MAX).slice(0, 3),
    );
  });
});

describe('rampAt', () => {
  it('clamps outside 0..1', () => {
    expect(rampAt(-1)).toEqual(rampAt(0));
    expect(rampAt(2)).toEqual(rampAt(1));
  });
});

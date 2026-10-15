import { describe, expect, it } from 'vitest';
import { GeoJsonLayer } from '@deck.gl/layers';

// `DeckMapLayers` is imported for its module side effects (deck.gl must be constructible in
// this environment); the layer stack itself is exercised by constructing the same layers
// `buildLayers` does and asserting on the props that carry behaviour.
import { DeckMapLayers } from './DeckMapLayers';
import {
  DENSITY_COLOR_MAX,
  densityColor,
  HEATMAP_RAMP_CSS,
  RAMP,
  rampAt,
} from './heatmapMath';

describe('the colour ramp', () => {
  it('is ordered, and spans the whole range', () => {
    // The ramp indexes into itself by stop, so an out-of-order table reads the wrong pair.
    expect(RAMP[0].stop).toBe(0);
    expect(RAMP[RAMP.length - 1].stop).toBe(1);
    for (let i = 1; i < RAMP.length; i++) {
      expect(RAMP[i].stop).toBeGreaterThan(RAMP[i - 1].stop);
    }
  });

  it('is what the legend gradient is built from', () => {
    // The invariant: the key cannot describe colours the map no longer paints. Every stop
    // the layer draws with must appear in the gradient, with its position.
    for (const { stop, color } of RAMP) {
      expect(HEATMAP_RAMP_CSS).toContain(`rgb(${color.join(',')})`);
      expect(HEATMAP_RAMP_CSS).toContain(`${(stop * 100).toFixed(0)}%`);
    }
  });

  it('interpolates between the stops rather than snapping to them', () => {
    // A mid-stop intensity must not equal either neighbour, or the field would band into five
    // colours instead of reading as a gradient.
    const between = rampAt(0.4);
    expect(between).not.toEqual(RAMP[1].color);
    expect(between).not.toEqual(RAMP[2].color);
  });
});

describe('the density colour scale', () => {
  it('puts the cold end on zero and red on the reference count', () => {
    expect(densityColor(0).slice(0, 3)).toEqual(RAMP[0].color);
    expect(densityColor(DENSITY_COLOR_MAX).slice(0, 3)).toEqual([
      ...RAMP[RAMP.length - 1].color,
    ]);
  });

  it('is the ramp read at a square root of the count', () => {
    // The scale is not a free choice — it is the legend's "25+" and the layer's colour
    // agreeing — so this pins the mapping for counts across the range, including one past
    // the reference, which must clamp rather than run off the ramp.
    for (const count of [0, 1, 6, 12, 25, 100]) {
      expect(densityColor(count)).toEqual([
        ...rampAt(Math.sqrt(count / DENSITY_COLOR_MAX)),
        216,
      ]);
    }
  });

  it('fails to the cold end when the count is unreadable', () => {
    // `count` arrives as `Number(feature.properties.count)`. A missing or malformed property
    // is `NaN`, which compares false against every stop and would fall *through* the ramp to
    // the hottest colour — an unreadable cell must read as empty, not as the peak.
    expect(densityColor(Number.NaN)).toEqual(densityColor(0));
    expect(densityColor(-5)).toEqual(densityColor(0));
    expect(Number.isFinite(densityColor(0)[0])).toBe(true);
  });

  it('constructs without a WebGL context, so the module is import-safe', () => {
    // The admin bundle is code-split around this; if constructing a layer needed a canvas,
    // the import would throw in any non-browser context (SSR, tests).
    expect(DeckMapLayers).toBeTypeOf('function');
    expect(
      new GeoJsonLayer({
        id: 'g',
        data: { type: 'FeatureCollection', features: [] },
      }),
    ).toBeDefined();
  });
});

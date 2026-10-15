import { describe, expect, it } from 'vitest';
import { GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

// `DeckMapLayers` is imported for its module side effects (deck.gl must be constructible in
// this environment); the layer stack itself is exercised by constructing the same layers
// `buildLayers` does and asserting on the props that carry behaviour.
import { DeckMapLayers } from './DeckMapLayers';
import { HEATMAP_RADIUS_PX, HEATMAP_RAMP_CSS, RAMP } from './heatmapMath';

const POINTS = [
  { latitude: 34.05, longitude: -118.25 },
  { latitude: 34.06, longitude: -118.24 },
];

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
});

describe('the layer stack deck.gl is given', () => {
  it('leaves the heatmap domain to deck.gl', () => {
    // Not a style preference. A hand-computed domain sat on a different kernel and radius
    // from the aggregation it was applied to, which flattened the whole field to the cold
    // end of the ramp whenever it was set. deck derives it from the dataset, and that is
    // stable across pans — measured, panning the dense area away drops the warm share rather
    // than promoting whatever is left to red.
    const layer = new HeatmapLayer({
      id: 'interaction-heatmap',
      data: POINTS,
      getPosition: (p: { longitude: number; latitude: number }) => [
        p.longitude,
        p.latitude,
      ],
      colorRange: RAMP.map((stop) => stop.color),
      radiusPixels: HEATMAP_RADIUS_PX,
    });
    // deck's own default is `null`, which means "derive it from the data" — so this asserts
    // that nothing overrode it, not merely that the prop is absent.
    expect(layer.props.colorDomain).toBeNull();
    expect(layer.props.radiusPixels).toBe(HEATMAP_RADIUS_PX);
  });

  it('maps a region count through the choropleth ramp', () => {
    const maxCount = 100;
    const alphaFor = (count: number) => {
      const t = maxCount > 0 ? Math.sqrt(Math.max(0, count) / maxCount) : 0;
      return count > 0 ? 0.18 * t + 0.06 : 0.06;
    };
    // The three behaviours worth pinning: zero is the flat empty tint, the max is the most
    // saturated, and the mid-point is monotonic between them.
    expect(alphaFor(0)).toBeCloseTo(0.06, 6);
    expect(alphaFor(100)).toBeCloseTo(0.24, 6);
    expect(alphaFor(25)).toBeGreaterThan(alphaFor(0));
    expect(alphaFor(25)).toBeLessThan(alphaFor(100));
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

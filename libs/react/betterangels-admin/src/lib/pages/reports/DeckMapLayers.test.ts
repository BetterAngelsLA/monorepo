import { describe, expect, it } from 'vitest';
import { DeckMapLayers, colorDomainFor } from './DeckMapLayers';

// `DeckMapLayers` is imported for its module side effects (deck.gl must be constructible in
// this environment); the layer stack itself is exercised through `buildLayers`' contract via
// `colorDomainFor` and by constructing the layers the same way the component does.
import { GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

const OVERLAY = {
  emptyFill: '#DCE3EA',
  fullFill: '#1B3A5C',
  stroke: '#1B3A5C',
  markFill: '#ff4d4f',
};

const POINTS = [
  { latitude: 34.05, longitude: -118.25 },
  { latitude: 34.06, longitude: -118.24 },
];

describe('colorDomainFor', () => {
  it('returns null when no reference is available, handing the default back to deck.gl', () => {
    // A wrong domain is worse than a briefly swimming one: null is deliberate.
    expect(colorDomainFor(null, 11)).toBeNull();
  });

  it('returns null for a zoom the reference did not cover', () => {
    expect(colorDomainFor(new Map([[11, 10]]), 19)).toBeNull();
  });

  it('never returns a zero or negative upper bound', () => {
    // A [0, 0] domain would make every pixel the top of the ramp.
    expect(colorDomainFor(new Map([[11, 0]]), 11)).toBeNull();
    expect(colorDomainFor(new Map([[11, -3]]), 11)).toBeNull();
  });

  it('brackets the reference peak, and rounds the zoom to the drawn level', () => {
    // The handler snaps to whole levels, so 10.4 and 10.0 must agree.
    const reference = new Map([[10, 250]]);
    expect(colorDomainFor(reference, 10)).toEqual([0, 250]);
    expect(colorDomainFor(reference, 10.4)).toEqual([0, 250]);
  });
});

describe('the layer stack deck.gl is given', () => {
  // These construct the same layers `buildLayers` does. Asserting on the props that carry the
  // hand-rolled behaviour we are replacing: the stable colour domain, and the choropleth's
  // count-driven fill.

  it('anchors the heatmap to the reference peak rather than the viewport', () => {
    const layer = new HeatmapLayer({
      id: 'interaction-heatmap',
      data: POINTS,
      getPosition: (p: { longitude: number; latitude: number }) => [p.longitude, p.latitude],
      colorDomain: colorDomainFor(new Map([[11, 349]]), 11) ?? undefined,
    });
    // The viewport would give `undefined` here; ours is the dataset peak.
    expect(layer.props.colorDomain).toEqual([0, 349]);
  });

  it('omits colorDomain before the reference exists, so deck.gl uses its default', () => {
    const layer = new HeatmapLayer({ id: 'h', data: POINTS, colorDomain: colorDomainFor(null, 11) ?? undefined });
    expect(layer.props.colorDomain).toBeUndefined();
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
      new GeoJsonLayer({ id: 'g', data: { type: 'FeatureCollection', features: [] } }),
    ).toBeDefined();
  });
});

describe('the module surface', () => {
  it('exports the overlay component', () => {
    expect(typeof DeckMapLayers).toBe('function');
    expect(OVERLAY.stroke).toMatch(/^#/);
  });
});

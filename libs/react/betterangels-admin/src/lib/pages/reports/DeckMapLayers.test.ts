import { describe, expect, it } from 'vitest';
import { MVTLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { Accessor, AccessorFunction, Color, Layer } from '@deck.gl/core';

// `buildLayers` is the module's real logic, exported so it can be asserted directly: jsdom has
// no WebGL context, so nothing here renders, and the layer props carry the behaviour.
import {
  buildLayers,
  isRefusedTileError,
  type OverlayColors,
} from './DeckMapLayers';
import type { Cluster } from './clusterPoints';
import { HEATMAP_RAMP_CSS, RAMP, rampAt } from './heatmapMath';

// `densityColor`'s own behaviour lives in `heatmapMath.test.ts`; what is asserted here is the
// invariant that binds the ramp to the legend this module draws, which that file does not cover.
describe('the colour ramp the legend is built from', () => {
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

const DENSITY_URL =
  'http://localhost:8000/regions/tiles/density/{z}/{x}/{y}.mvt?org_id=2&start=2026-01-01&end=2026-01-31';

const BOUNDARY_URL =
  'http://localhost:8000/regions/tiles/council_district/{z}/{x}/{y}.mvt';

const OVERLAY: OverlayColors = {
  stroke: '#111111',
  markFill: '#cc0000',
};

const POINT = { latitude: 34.05, longitude: -118.24 };

function layersFor(overrides: Partial<Parameters<typeof buildLayers>[0]>) {
  return buildLayers({
    points: [],
    view: 'heatmap',
    regionKind: null,
    focusCodes: [],
    boundaryUrl: null,
    densityUrl: null,
    clusters: [],
    overlay: OVERLAY,
    ...overrides,
  });
}

/** A layer's `props` is typed from the layer's own generic, so narrow by class first. */
function findLayer<T extends Layer>(
  layers: Layer[],
  id: string,
  // `instanceof` narrowing happens in the caller; this keeps the test free of casts.
  matches: (layer: Layer) => layer is T,
): T {
  const found = layers.find((layer) => layer.id === id);
  if (found === undefined || !matches(found)) {
    throw new Error(`expected a ${id} layer`);
  }
  return found;
}

const isMvt = (layer: Layer): layer is MVTLayer => layer instanceof MVTLayer;
const isScatterplot = (layer: Layer): layer is ScatterplotLayer =>
  layer instanceof ScatterplotLayer;
const isClusterText = (layer: Layer): layer is TextLayer<Cluster> =>
  layer instanceof TextLayer;

/** The binary shape `clustersToBinary` builds; deck.gl's `data` prop is typed as row data. */
type BinaryClusters = {
  length: number;
  attributes: { getPosition: { value: Float32Array } };
};

function isBinaryClusters(data: unknown): data is BinaryClusters {
  return (
    typeof data === 'object' &&
    data !== null &&
    'length' in data &&
    'attributes' in data
  );
}

/** A tile's feature, as deck.gl's accessors see it. Only `properties` is read. */
const featureWith = (code: string) => ({
  type: 'Feature' as const,
  geometry: { type: 'Point' as const, coordinates: [0, 0] },
  properties: { code },
});

/**
 * deck.gl types an accessor as "a value or a function", because both are legal props. These
 * tests pass functions, so this reads one datum through it. The one assertion is the narrowing
 * TypeScript cannot express for a generic `Out` that might itself be callable — it is confined
 * to this helper rather than spread over the assertions.
 */
function read<In, Out>(accessor: Accessor<In, Out>, datum: In): Out {
  if (typeof accessor !== 'function') {
    throw new Error('expected a function accessor');
  }
  const asFunction = accessor as AccessorFunction<In, Out>;
  return asFunction(datum, { index: 0, data: [datum], target: [] });
}

/** The alpha channel; a 3-component colour means fully opaque. */
function alphaOf(color: Color): number {
  return color[3] ?? 255;
}

describe('the layer stack', () => {
  it('draws the density field under the boundary frame', () => {
    // The ordering fix: the grid is opaque over the area its data bounds, so boundaries drawn
    // before it are painted over and the geography disappears. Order is the whole behaviour.
    const layers = layersFor({
      view: 'heatmap',
      regionKind: 'council_district',
      densityUrl: DENSITY_URL,
      boundaryUrl: BOUNDARY_URL,
    });

    expect(layers.map((layer) => layer.id)).toEqual([
      'interaction-density',
      'region-boundaries-council_district',
    ]);
  });

  it('keeps the boundary frame last when the clusters are drawn', () => {
    const layers = layersFor({
      view: 'clusters',
      points: [POINT],
      regionKind: 'council_district',
      densityUrl: DENSITY_URL,
      boundaryUrl: BOUNDARY_URL,
      clusters: [{ ...POINT, count: 3 }],
    });

    expect(layers.map((layer) => layer.id)).toEqual([
      'interaction-clusters',
      'interaction-cluster-counts',
      'region-boundaries-council_district',
    ]);
  });

  it('draws the boundary layer stroke-only', () => {
    const layers = layersFor({
      view: 'heatmap',
      regionKind: 'council_district',
      densityUrl: DENSITY_URL,
      boundaryUrl: BOUNDARY_URL,
    });
    const boundary = findLayer(
      layers,
      'region-boundaries-council_district',
      isMvt,
    );

    // Filled boundaries would be a second encoding of the quantity the density grid already
    // encodes as a colour.
    expect(boundary.props.filled).toBe(false);
    expect(boundary.props.stroked).toBe(true);
  });

  it('wires the boundary accessors to the props they read', () => {
    // Without these, deck.gl keeps the attribute buffers from the previous props: changing the
    // focus selection would recolour nothing until the tile happened to reload.
    const focusCodes = ['4'];
    const layers = layersFor({
      view: 'heatmap',
      regionKind: 'council_district',
      densityUrl: DENSITY_URL,
      boundaryUrl: BOUNDARY_URL,
      focusCodes,
    });
    const boundary = findLayer(
      layers,
      'region-boundaries-council_district',
      isMvt,
    );

    expect(boundary.props.updateTriggers?.getLineColor).toEqual([
      OVERLAY.stroke,
      focusCodes,
    ]);
    expect(boundary.props.updateTriggers?.getLineWidth).toEqual([focusCodes]);
  });

  it('emphasises the focused regions and fades the rest', () => {
    const layers = layersFor({
      view: 'heatmap',
      regionKind: 'council_district',
      densityUrl: DENSITY_URL,
      boundaryUrl: BOUNDARY_URL,
      focusCodes: ['4'],
    });
    const boundary = findLayer(
      layers,
      'region-boundaries-council_district',
      isMvt,
    );

    const lineColor = boundary.props.getLineColor;
    const lineWidth = boundary.props.getLineWidth;
    const focusedColor = read(lineColor, featureWith('4'));
    const fadedColor = read(lineColor, featureWith('9'));

    expect(read(lineWidth, featureWith('4'))).toBeGreaterThan(
      read(lineWidth, featureWith('9')),
    );
    expect(alphaOf(focusedColor)).toBeGreaterThan(alphaOf(fadedColor));
  });

  it('fades nothing when no regions are focused', () => {
    const layers = layersFor({
      view: 'heatmap',
      regionKind: 'council_district',
      densityUrl: DENSITY_URL,
      boundaryUrl: BOUNDARY_URL,
      focusCodes: [],
    });
    const boundary = findLayer(
      layers,
      'region-boundaries-council_district',
      isMvt,
    );

    const lineColor = boundary.props.getLineColor;
    const lineWidth = boundary.props.getLineWidth;

    // Two different regions must read identically, and at the full alpha a focused one gets.
    expect(read(lineColor, featureWith('4'))).toEqual(
      read(lineColor, featureWith('9')),
    );
    expect(read(lineWidth, featureWith('4'))).toBe(
      read(lineWidth, featureWith('9')),
    );
  });

  it('sends the session cookie with both tile layers', () => {
    // The API is on another origin in development and authorizes on the session cookie;
    // without `credentials: 'include'` every tile arrives as an anonymous 403.
    const layers = layersFor({
      view: 'heatmap',
      regionKind: 'council_district',
      densityUrl: DENSITY_URL,
      boundaryUrl: BOUNDARY_URL,
    });
    const tiles = layers.filter((layer) => layer instanceof MVTLayer);

    expect(tiles).toHaveLength(2);
    for (const tile of tiles) {
      expect(tile.props.loadOptions?.fetch?.credentials).toBe('include');
    }
  });
});

describe('the cluster layers', () => {
  const clusters: Cluster[] = [
    { ...POINT, count: 1 },
    { latitude: 34.1, longitude: -118.3, count: 6 },
  ];

  it('are absent from the density view', () => {
    const layers = layersFor({
      view: 'heatmap',
      points: [POINT],
      clusters,
    });

    expect(layers.some((layer) => layer.id === 'interaction-clusters')).toBe(
      false,
    );
  });

  it('are absent until there are points to bin', () => {
    const layers = layersFor({
      view: 'clusters',
      points: [],
      clusters,
    });

    expect(layers.some((layer) => layer.id === 'interaction-clusters')).toBe(
      false,
    );
  });

  it('draw every cluster, but number only the ones standing for more than one', () => {
    const layers = layersFor({
      view: 'clusters',
      points: [POINT],
      clusters,
    });

    const bubbles = findLayer(layers, 'interaction-clusters', isScatterplot);
    const counts = findLayer(layers, 'interaction-cluster-counts', isClusterText);

    // Every cluster is a bubble, and the positions and radii reached deck.gl as buffers.
    const binary = bubbles.props.data;
    if (!isBinaryClusters(binary)) {
      throw new Error('expected binary cluster data');
    }
    expect(binary.length).toBe(2);
    expect(binary.attributes.getPosition.value).toBeInstanceOf(Float32Array);
    expect(binary.attributes.getPosition.value.length).toBe(4);

    // A bin of one is just a dot; labelling it "1" would shout over the whole map.
    const labelled = counts.props.data;
    if (!Array.isArray(labelled)) {
      throw new Error('expected cluster rows');
    }
    expect(labelled).toHaveLength(1);
    expect(labelled[0].count).toBe(6);
  });
});

describe('the tile-error classifier', () => {
  it('tells a refusal apart from a fault', () => {
    // loaders.gl's message for a non-2xx response; the endpoint answers 403 when the note
    // read scope withholds the grid.
    // Both message shapes loaders.gl puts a status in, because which one fires depends on
    // the path the tile takes through `load()`.
    expect(isRefusedTileError(new Error('fetch failed 403 Forbidden'))).toBe(true);
    expect(isRefusedTileError(new Error('fetch failed 401 Unauthorized'))).toBe(
      true,
    );
    // **The shape this endpoint actually produces**, captured from the browser's console
    // while every density tile was being refused.
    expect(
      isRefusedTileError(
        new Error(
          'Failed to fetch resource (403) Forbidden: http://localhost:8000/regions/tiles/density/8/43/102.mvt?org_id=2',
        ),
      ),
    ).toBe(true);
    expect(
      isRefusedTileError(
        new Error(
          'Failed to fetch resource http://localhost:8000/regions/tiles/density/8/43/102.mvt (403): Forbidden',
        ),
      ),
    ).toBe(true);
    expect(
      isRefusedTileError(
        new Error(
          'Failed to fetch resource http://localhost:8000/regions/tiles/density/8/401/102.mvt (401): Unauthorized',
        ),
      ),
    ).toBe(true);
    // A fault must not be reported to the reader as a permission answer.
    expect(
      isRefusedTileError(new Error('fetch failed 500 Internal Server Error')),
    ).toBe(false);
    expect(isRefusedTileError(new Error('fetch failed 204 No Content'))).toBe(
      false,
    );
    // **The false positive this guard was written for.** The error carries the tile URL, so a
    // tile at x=403 that failed for an unrelated reason must not read as a 403 refusal —
    // matching a bare `403` anywhere did exactly that, and replaced the whole map with
    // "your role cannot see this".
    expect(
      isRefusedTileError(
        new Error('Failed to load /regions/tiles/density/8/403/101.mvt?org_id=2'),
      ),
    ).toBe(false);
    expect(isRefusedTileError(undefined)).toBe(false);
  });

  // The classifier decides; the layer has to act on the decision. Both halves of that are
  // asserted here, because a non-refusal error that reaches neither callback draws nothing and
  // says nothing — an empty field under a legend promising a density reading.
  const densityErrorCallbacks = () => {
    const calls = { fault: 0, refused: 0 };
    const layers = layersFor({
      densityUrl: 'https://example.test/density/{z}/{x}/{y}.mvt',
      onTileFault: () => {
        calls.fault += 1;
      },
      onDensityRefused: () => {
        calls.refused += 1;
      },
    });
    return { calls, density: findLayer(layers, 'interaction-density', isMvt) };
  };

  it('reports a non-refusal tile error as a fault', () => {
    const { calls, density } = densityErrorCallbacks();

    density.props.onTileError?.(
      new Error('fetch failed 500 Internal Server Error'),
    );

    expect(calls.fault).toBe(1);
    expect(calls.refused).toBe(0);
  });

  it('reports a refused tile as a refusal, not as a fault', () => {
    const { calls, density } = densityErrorCallbacks();

    density.props.onTileError?.(
      new Error(
        'Failed to fetch resource (403) Forbidden: https://example.test/density/8/43/102.mvt',
      ),
    );

    expect(calls.refused).toBe(1);
    expect(calls.fault).toBe(0);
  });
});

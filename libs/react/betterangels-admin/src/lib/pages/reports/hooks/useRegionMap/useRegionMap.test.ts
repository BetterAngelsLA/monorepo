import { describe, expect, it } from 'vitest';
import { isMultiPolygonCoordinates } from './useRegionMap';

/**
 * The backend sends region geometry through an untyped scalar — `JSON` maps to `any` in the
 * shared codegen config — so this guard is the only thing between a backend shape change and
 * a silently blank map. It is also the only place that encodes the nesting depth, which is
 * the detail most likely to be got wrong.
 */
describe('isMultiPolygonCoordinates', () => {
  const square = [
    [
      [
        [-118.3, 34.0],
        [-118.2, 34.0],
        [-118.2, 34.1],
        [-118.3, 34.0],
      ],
    ],
  ];

  it('accepts a polygon with one ring', () => {
    expect(isMultiPolygonCoordinates(square)).toBe(true);
  });

  it('accepts a polygon with a hole, and multiple polygons', () => {
    const withHole = [
      [
        square[0][0],
        [
          [-118.28, 34.02],
          [-118.22, 34.02],
          [-118.28, 34.02],
        ],
      ],
    ];
    expect(isMultiPolygonCoordinates(withHole)).toBe(true);
    expect(isMultiPolygonCoordinates([...square, ...square])).toBe(true);
  });

  it('rejects the three-level shape, which is the mistake worth guarding', () => {
    // `[[[lng, lat]]]` is a Polygon's coordinates, not a MultiPolygon's. `@types/geojson`
    // declares MultiPolygon.coordinates at this depth, so a hand-written cast can easily
    // produce it — and deck.gl renders it as a point cloud rather than a polygon.
    expect(isMultiPolygonCoordinates(square[0])).toBe(false);
  });

  it('rejects a GeoJSON document, which is what the API used to send', () => {
    expect(
      isMultiPolygonCoordinates({ type: 'MultiPolygon', coordinates: square }),
    ).toBe(false);
  });

  it('rejects coordinates that are not numbers', () => {
    expect(isMultiPolygonCoordinates([[['a', 'b']]])).toBe(false);
  });

  it('rejects empty structures rather than drawing nothing', () => {
    expect(isMultiPolygonCoordinates([])).toBe(false);
    expect(isMultiPolygonCoordinates([[]])).toBe(false);
    expect(isMultiPolygonCoordinates([[[]]])).toBe(false);
    expect(isMultiPolygonCoordinates([[[]], []])).toBe(false);
  });

  it('rejects non-array values, including the null the API can send', () => {
    for (const value of [null, undefined, 'geometry', 0, {}]) {
      expect(isMultiPolygonCoordinates(value)).toBe(false);
    }
  });
});

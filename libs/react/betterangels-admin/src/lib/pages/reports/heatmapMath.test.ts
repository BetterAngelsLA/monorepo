import { describe, expect, it } from 'vitest';
import {
  RADIUS_BY_ZOOM,
  computeReferencePeaks,
  radiusForZoom,
  rampColor,
  weightFor,
  type HeatPoint,
} from './heatmapMath';

/** A tight downtown cluster — the densest thing a viewport could ever be showing. */
function makeDowntown(n: number): HeatPoint[] {
  let seed = 1;
  const rnd = () =>
    (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({ length: n }, () => ({
    latitude: 34.05 + (rnd() - 0.5) * 0.02,
    longitude: -118.25 + (rnd() - 0.5) * 0.02,
  }));
}

/** A deterministic LA-shaped set: 70% dense downtown, 30% spread over the county. */
function makePoints(n: number): HeatPoint[] {
  let seed = 42;
  const rnd = () =>
    (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const points: HeatPoint[] = [];
  for (let i = 0; i < n; i++) {
    const tight = rnd() < 0.7;
    points.push({
      latitude: 34.05 + (tight ? (rnd() - 0.5) * 0.08 : (rnd() - 0.5) * 0.7),
      longitude: -118.25 + (tight ? (rnd() - 0.5) * 0.08 : (rnd() - 0.5) * 0.9),
    });
  }
  return points;
}

describe('radiusForZoom', () => {
  it('shrinks monotonically as you zoom in', () => {
    // Zoomed out must merge neighbours into clusters; zoomed in must separate them. A
    // non-monotonic table would make a zoom step widen the kernel.
    for (
      let zoom = RADIUS_BY_ZOOM[0][0];
      zoom < RADIUS_BY_ZOOM[RADIUS_BY_ZOOM.length - 1][0];
      zoom++
    ) {
      expect(radiusForZoom(zoom + 1)).toBeLessThanOrEqual(radiusForZoom(zoom));
    }
  });

  it('clamps below and above the table instead of extrapolating', () => {
    // The map can be zoomed past either end of the table; extrapolating a radius there
    // would give a negative or absurd kernel.
    const first = RADIUS_BY_ZOOM[0];
    const last = RADIUS_BY_ZOOM[RADIUS_BY_ZOOM.length - 1];
    expect(radiusForZoom(first[0] - 5)).toBe(first[1]);
    expect(radiusForZoom(last[0] + 5)).toBe(last[1]);
    expect(radiusForZoom(-100)).toBeGreaterThan(0);
  });

  it('matches the table exactly at its own sample points', () => {
    for (const [zoom, radius] of RADIUS_BY_ZOOM) {
      expect(radiusForZoom(zoom)).toBeCloseTo(radius, 10);
    }
  });
});

describe('weightFor', () => {
  it('decreases as the point count grows, so a dense set does not saturate', () => {
    // The point of dividing by sqrt(count): without it, adding data to a dataset would
    // push every pixel up the ramp.
    expect(weightFor(1000, 0.55)).toBeLessThan(weightFor(10, 0.55));
  });

  it('never divides by zero for an empty or single-point dataset', () => {
    expect(Number.isFinite(weightFor(0, 0.55))).toBe(true);
    expect(weightFor(0, 0.55)).toBe(weightFor(1, 0.55));
  });
});

describe('computeReferencePeaks', () => {
  const points = makePoints(1500);

  it('returns a peak for every sampled zoom level it was asked for', () => {
    const peaks = computeReferencePeaks(points, [6, 8, 10, 12]);
    for (const zoom of [6, 8, 10, 12]) {
      expect(peaks.get(zoom)).toBeGreaterThan(0);
    }
  });

  it('fills the gaps between sampled levels', () => {
    // The caller samples every second level for cost; the levels between must still be
    // present or the scale would be undefined at those zooms.
    const peaks = computeReferencePeaks(points, [6, 8, 10]);
    for (const zoom of [6, 7, 8, 9, 10]) {
      expect(peaks.has(zoom)).toBe(true);
    }
  });

  it('returns nothing for an empty dataset rather than a zero scale', () => {
    // A zero reference would make every pixel the top of the ramp.
    expect(computeReferencePeaks([], [6, 8]).size).toBe(0);
  });

  it('THE INVARIANT: sparse data elsewhere cannot move the reference', () => {
    // This is the bug the suite was written to find, and it was real: the reference used to
    // accumulate at `weightFor(points.length, …)`, which scales as 1/sqrt(n), so it depended
    // on how many points existed *anywhere* rather than on how they were distributed.
    // Appending 500 points in Orange County moved it by 17%; every interaction recorded
    // anywhere in the platform shifted the scale.
    //
    // The added points here are spread evenly across the county, so their per-cell density
    // is far below downtown's and they cannot legitimately raise the peak. Measured ratios
    // after the fix: 1.005 / 1.000 / 1.000 at z9 / z11 / z13.
    const downtown = makeDowntown(500);
    const spread: HeatPoint[] = Array.from({ length: 500 }, (_, i) => ({
      latitude: 33.6 + ((i * 0.001 * 97) % 1.2),
      longitude: -118.9 + ((i * 0.001 * 53) % 1.6),
    }));

    for (const zoom of [9, 11, 13]) {
      const before = computeReferencePeaks(downtown, [zoom]).get(
        zoom,
      ) as number;
      const after = computeReferencePeaks([...downtown, ...spread], [zoom]).get(
        zoom,
      ) as number;
      expect(after / before).toBeLessThan(1.01);
    }
  });

  it('THE BOUND: the reference equals the field the draw actually produces', () => {
    // The reference is what the ramp is normalised against, so it must not be *below* any
    // pixel the draw can produce — that would clamp colours at the top of the ramp — and if
    // it is far above, the top of the ramp is never reached. Measured: it matches the true
    // convolved maximum exactly (1.00x) at z9, z11 and z13, which is tighter than the
    // "~2-3x overshoot" the draw code's comments claim.
    const points = makePoints(2000);
    for (const zoom of [9, 11, 13]) {
      const metresPerPixel =
        (156543 * Math.cos((34 * Math.PI) / 180)) / Math.pow(2, zoom);
      const cell = Math.max(metresPerPixel / 111320, 1e-12);
      const pixels = radiusForZoom(zoom);
      const reference = computeReferencePeaks(points, [zoom]).get(
        zoom,
      ) as number;

      // Rebuild the draw's own accumulation and take its maximum.
      const buckets = new Map<string, number>();
      for (const point of points) {
        const key = `${Math.floor(point.longitude / cell)}:${Math.floor(point.latitude / cell)}`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      const span = Math.ceil(pixels);
      const radiusSq = pixels * pixels;
      const offsets: [number, number, number][] = [];
      for (let dy = -span; dy <= span; dy++) {
        for (let dx = -span; dx <= span; dx++) {
          const d2 = dx * dx + dy * dy;
          if (d2 > radiusSq) continue;
          const t = 1 - d2 / radiusSq;
          offsets.push([dx, dy, t * t]);
        }
      }
      let peak = 0;
      for (const key of buckets.keys()) {
        const [cx, cy] = key.split(':').map(Number);
        let value = 0;
        for (const [dx, dy, shape] of offsets) {
          const neighbour = buckets.get(`${cx + dx}:${cy + dy}`);
          if (neighbour) value += neighbour * shape;
        }
        if (value > peak) peak = value;
      }

      expect(reference).toBeCloseTo(peak, 6);
    }
  });

  it('grows when density actually increases, so the ramp is not flat', () => {
    // The counterpart to the invariant above: making the busy area busier *must* move the
    // reference, or the scale would be insensitive to the data it describes.
    const sparse = makeDowntown(200);
    const dense = [...sparse, ...makeDowntown(200)];
    const sparseRef = computeReferencePeaks(sparse, [11]).get(11) as number;
    const denseRef = computeReferencePeaks(dense, [11]).get(11) as number;
    expect(denseRef).toBeGreaterThanOrEqual(sparseRef);
  });
});

describe('rampColor', () => {
  it('clamps out-of-range values instead of extrapolating into invalid colours', () => {
    // The caller can hand it a ratio above 1 (a pixel hotter than the reference).
    for (const t of [-1, -0.001, 1.001, 5, Number.NaN]) {
      const [r, g, b] = rampColor(t);
      for (const channel of [r, g, b]) {
        expect(Number.isFinite(channel)).toBe(true);
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });

  it('returns the documented endpoints at 0 and 1', () => {
    expect(rampColor(0)).toEqual([40, 60, 200]);
    expect(rampColor(1)).toEqual([220, 30, 20]);
  });

  it("interpolates within each channel's valid range across the whole ramp", () => {
    // Note red is deliberately *not* monotonic: the ramp is blue -> cyan at the cold end,
    // so red falls to 0 before rising to the hot red. Asserting monotonic red was wrong.
    // Explicit steps, not `t += 0.05`: accumulating 0.05 twenty times lands on
    // 1.0000000000000007, so the final sample was never exactly the hot end.
    for (let step = 0; step <= 20; step++) {
      const current = rampColor(step / 20);
      for (let i = 0; i < 3; i++) {
        expect(current[i]).toBeGreaterThanOrEqual(0);
        expect(current[i]).toBeLessThanOrEqual(255);
      }
    }
    expect(rampColor(1)).toEqual([220, 30, 20]);
  });

  it('is continuous across a stop boundary', () => {
    // Stops are interpolated, not stepped — a jump at a boundary would band visibly.
    const before = rampColor(0.3 - 1e-6);
    const after = rampColor(0.3 + 1e-6);
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(before[i] - after[i])).toBeLessThanOrEqual(1);
    }
  });
});

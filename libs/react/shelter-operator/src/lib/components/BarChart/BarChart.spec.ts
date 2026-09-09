import { bucketData } from './bucketData';

describe('bucketData', () => {
  const makeRows = (labels: string[], value = 10) =>
    labels.map((x) => ({ x, y: value }));

  it('returns data unchanged when x-values do not exceed maxBars', () => {
    const data = makeRows(['A', 'B', 'C']);
    expect(bucketData(data, 'x', 'y', undefined, 5)).toEqual(data);
  });

  it('buckets data into at most maxBars groups', () => {
    const labels = Array.from({ length: 10 }, (_, i) => String(i));
    const data = makeRows(labels, 10);
    const result = bucketData(data, 'x', 'y', undefined, 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('labels a multi-item bucket as "first - last"', () => {
    const data = makeRows(['Jan', 'Feb', 'Mar', 'Apr', 'May']);
    const result = bucketData(data, 'x', 'y', undefined, 2);
    expect(result[0].x).toBe('Jan - Feb');
    expect(result[1].x).toBe('Mar - May');
  });

  it('splits into buckets whose sizes differ by at most one', () => {
    const labels = Array.from({ length: 10 }, (_, i) => String(i));
    const result = bucketData(makeRows(labels), 'x', 'y', undefined, 4);
    // 10 across 4 buckets is 2/3/2/3, never 3/3/3/1.
    expect(result.map((r) => r.x)).toEqual([
      '0 - 1',
      '2 - 4',
      '5 - 6',
      '7 - 9',
    ]);
  });

  it('uses the full bar budget when data only just exceeds maxBars', () => {
    const labels = Array.from({ length: 41 }, (_, i) => String(i));
    const result = bucketData(makeRows(labels), 'x', 'y', undefined, 40);
    expect(result).toHaveLength(40);
  });

  it('averages y-values within each bucket', () => {
    const data = [
      { x: 'A', y: 10 },
      { x: 'B', y: 20 },
      { x: 'C', y: 30 },
    ];
    const result = bucketData(data, 'x', 'y', undefined, 1);
    expect(result).toHaveLength(1);
    expect(result[0].y).toBe(20);
  });

  it('rounds averaged y-values to one decimal place', () => {
    // Mean is 10.666…, so an unrounded average would fail this.
    const data = [
      { x: 'A', y: 10 },
      { x: 'B', y: 11 },
      { x: 'C', y: 11 },
    ];
    const result = bucketData(data, 'x', 'y', undefined, 1);
    expect(result[0].y).toBe(10.7);
  });

  it('averages per colorField series within each bucket', () => {
    const data = [
      { x: 'A', y: 10, color: 'red' },
      { x: 'A', y: 20, color: 'blue' },
      { x: 'B', y: 30, color: 'red' },
      { x: 'B', y: 40, color: 'blue' },
    ];
    const result = bucketData(data, 'x', 'y', 'color', 1);
    const redRow = result.find((r) => r['color'] === 'red');
    const blueRow = result.find((r) => r['color'] === 'blue');
    expect(redRow?.y).toBe(20);
    expect(blueRow?.y).toBe(30);
  });

  it('returns empty array for empty input', () => {
    expect(bucketData([], 'x', 'y', undefined, 5)).toEqual([]);
  });

  it('handles maxBars=1 by collapsing everything into one bucket', () => {
    const data = makeRows(['A', 'B', 'C', 'D', 'E'], 5);
    const result = bucketData(data, 'x', 'y', undefined, 1);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBe('A - E');
    expect(result[0].y).toBe(5);
  });

  it('preserves insertion order for bucket boundaries', () => {
    const data = makeRows(['Z', 'Y', 'X', 'W']);
    const result = bucketData(data, 'x', 'y', undefined, 2);
    expect(result[0].x).toBe('Z - Y');
    expect(result[1].x).toBe('X - W');
  });
});

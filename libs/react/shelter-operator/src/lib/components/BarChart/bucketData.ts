import { groupBy, meanBy, unique } from 'remeda';

/**
 * Groups chart data into at most `maxBars` buckets and averages the y-values
 * within each bucket. For multi-series (stacked/grouped) charts, values are
 * averaged per series (colorField) within each bucket.
 *
 * The x-axis label for a bucket with more than one point becomes
 * "firstLabel - lastLabel".
 *
 * **Ordering**: bucket boundaries are derived from the insertion order of
 * unique x-values in `data`. Callers must pass data in the intended display
 * order (e.g. chronological for date series) so bucket ranges are meaningful.
 */
export function bucketData(
  data: Record<string, unknown>[],
  xField: string,
  yField: string,
  colorField: string | undefined,
  maxBars: number,
): Record<string, unknown>[] {
  const xValues = unique(data.map((d) => d[xField]));

  if (xValues.length <= maxBars) return data;

  // Build a lookup map from x-value → rows once (O(n)) so each bucket can
  // retrieve its rows in O(bucket-size) rather than re-scanning all data.
  const rowsByX = new Map<unknown, Record<string, unknown>[]>();
  for (const d of data) {
    const x = d[xField];
    const bucket = rowsByX.get(x);
    if (bucket) {
      bucket.push(d);
    } else {
      rowsByX.set(x, [d]);
    }
  }

  // Split into exactly `maxBars` buckets whose sizes differ by at most one.
  // A fixed size of ceil(n / maxBars) would collapse 41 values into 21 bars,
  // so one value past the limit would halve the chart.
  const bucketCount = Math.min(xValues.length, maxBars);
  const buckets = Array.from({ length: bucketCount }, (_, i) =>
    xValues.slice(
      Math.floor((i * xValues.length) / bucketCount),
      Math.floor(((i + 1) * xValues.length) / bucketCount),
    ),
  );

  return buckets.flatMap((bucketXValues) => {
    const label =
      bucketXValues.length === 1
        ? String(bucketXValues[0])
        : `${bucketXValues[0]} - ${bucketXValues[bucketXValues.length - 1]}`;

    const bucketRows = bucketXValues.flatMap((x) => rowsByX.get(x) ?? []);

    if (!colorField) {
      const avg = meanBy(bucketRows, (d) => Number(d[yField]) || 0) ?? 0;
      return [
        {
          ...bucketRows[0],
          [xField]: label,
          [yField]: Math.round(avg * 10) / 10,
        },
      ];
    }

    return Object.values(groupBy(bucketRows, (d) => String(d[colorField]))).map(
      (colorRows) => {
        const avg = meanBy(colorRows, (d) => Number(d[yField]) || 0) ?? 0;
        return {
          ...colorRows[0],
          [xField]: label,
          [yField]: Math.round(avg * 10) / 10,
        };
      },
    );
  });
}

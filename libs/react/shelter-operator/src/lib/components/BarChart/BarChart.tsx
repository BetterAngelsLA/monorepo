import type { ColumnConfig } from '@ant-design/plots';
import { Column } from '@ant-design/plots';
import { mergeCss } from '@monorepo/react/shared';
import { useLayoutEffect, useRef, useState } from 'react';
import { chunk, groupBy, meanBy, mergeDeep, unique } from 'remeda';
const FONT_FAMILY = "'Poppins', ui-sans-serif, system-ui, sans-serif";
const RESIZE_DEBOUNCE_MS = 150;
const DEFAULT_MAX_BARS = 40;

/**
 * Groups chart data into at most `maxBars` buckets and averages the y-values
 * within each bucket. For multi-series (stacked/grouped) charts, values are
 * averaged per series (colorField) within each bucket.
 *
 * The x-axis label for a bucket with more than one point becomes
 * "firstLabel - lastLabel".
 */
function bucketData(
  data: Record<string, unknown>[],
  xField: string,
  yField: string,
  colorField: string | undefined,
  maxBars: number,
): Record<string, unknown>[] {
  const xValues = unique(data.map((d) => d[xField]));

  if (xValues.length <= maxBars) return data;

  const bucketSize = Math.ceil(xValues.length / maxBars);

  return chunk(xValues, bucketSize).flatMap((bucketXValues) => {
    const label =
      bucketXValues.length === 1
        ? String(bucketXValues[0])
        : `${bucketXValues[0]} - ${bucketXValues[bucketXValues.length - 1]}`;

    const bucketRows = data.filter((d) => bucketXValues.includes(d[xField]));

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
function darkenHex(hex: string, amount = 0.18): string {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const num = parseInt(full, 16);
  if (Number.isNaN(num) || full.length !== 6) return hex;
  const r = Math.round(((num >> 16) & 255) * (1 - amount));
  const g = Math.round(((num >> 8) & 255) * (1 - amount));
  const b = Math.round((num & 255) * (1 - amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export type ViewMode = 'count' | 'percentage';

export type BarChartProps = ColumnConfig & {
  className?: string;
  chartTitle?: string;
  showViewToggle?: boolean;
  onViewChange?: (mode: ViewMode) => Partial<ColumnConfig>;
  maxBars?: number;
  chartHeight?: number;
};

export function BarChart({
  className,
  chartTitle,
  showViewToggle,
  onViewChange,
  maxBars = DEFAULT_MAX_BARS,
  chartHeight,
  ...config
}: BarChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('count');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [_resizeKey, setResizeKey] = useState(0);

  useLayoutEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      clearTimeout(timer);
      timer = setTimeout(() => setResizeKey(width), RESIZE_DEBOUNCE_MS);
    });
    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const defaultConfig: Partial<ColumnConfig> = {
    autoFit: true,
    insetTop: 4,
    style: {
      radiusTopLeft: 2,
      radiusTopRight: 2,
    },
    axis: {
      x: {
        labelFontFamily: FONT_FAMILY,
        labelFontSize: 12,
        labelFontWeight: 400,
        labelLetterSpacing: -0.24,
        titleFontFamily: FONT_FAMILY,
        titleFontSize: 16,
        titleFontWeight: 400,
        titleLetterSpacing: -0.32,
        titleLineHeight: 24,
        titleFill: '#747A82',
        line: true,
        lineLineWidth: 2,
        lineStroke: '#7e838c',
        zIndex: 1,
      },
      y: {
        labelFontFamily: FONT_FAMILY,
        labelFontSize: 12,
        labelFontWeight: 400,
        labelLetterSpacing: 0,
        labelLineHeight: 20,
        labelTextAlign: 'right',
        titleFontFamily: FONT_FAMILY,
        titleFontSize: 16,
        titleFontWeight: 400,
        titleLetterSpacing: -0.32,
        titleLineHeight: 24,
        titleFill: '#747A82',
        tick: false,
        grid: true,
        gridStroke: '#D3D9E3',
        gridStrokeOpacity: 1,
        gridLineWidth: 1,
        gridLineDash: [3, 3],
        gridFilter: (_datum: unknown, index: number) => index !== 0,
      },
    },
    legend: false,
    interaction: {
      elementHighlight: false,
      elementHighlightByColor: false,
      elementHighlightByX: true,
      tooltip: { shared: true },
    },
  };

  const mergedConfig = mergeDeep(
    defaultConfig as Record<string, unknown>,
    config as Record<string, unknown>,
  ) as ColumnConfig;

  const viewOverrides = onViewChange?.(viewMode) ?? {};
  const displayConfig = mergeDeep(
    mergedConfig as Record<string, unknown>,
    viewOverrides as Record<string, unknown>,
  ) as ColumnConfig;

  const cfg = mergedConfig as Record<string, unknown>;
  const colorField = cfg['colorField'] as string | undefined;
  const data = (cfg['data'] as Record<string, unknown>[] | undefined) ?? [];
  const colorScale =
    (cfg['scale'] as { color?: { domain?: string[]; range?: string[] } })
      ?.color ?? {};
  const range = colorScale.range ?? [];
  const domain =
    colorScale.domain ??
    (colorField ? unique(data.map((d) => String(d[colorField]))) : []);
  const singleFill =
    ((cfg['style'] as { fill?: string } | undefined)?.fill as string) ??
    '#3B82F6';

  // Bucket the display data (already count or percentage based on viewMode)
  // down to at most `maxBars` bars by averaging consecutive values.
  const xField = cfg['xField'] as string | undefined;
  const yField = cfg['yField'] as string | undefined;
  const displayData =
    ((displayConfig as Record<string, unknown>)['data'] as
      | Record<string, unknown>[]
      | undefined) ?? [];
  const finalData =
    xField && yField
      ? bucketData(displayData, xField, yField, colorField, maxBars)
      : displayData;

  const activeFill = (datum: Record<string, unknown>): string => {
    if (colorField && range.length) {
      const value = String(datum[colorField]);
      const idx = domain.indexOf(value);
      const base = range[(idx < 0 ? 0 : idx) % range.length];
      return darkenHex(base);
    }
    return darkenHex(singleFill);
  };

  const withState = {
    ...displayConfig,
    data: finalData,
    ...(!colorField
      ? {
          tooltip: {
            ...(displayConfig.tooltip as object | undefined),
            items: [
              (
                d: Record<string, unknown>,
                _index: number,
                _data: unknown[],
                _column: Record<string, { values: unknown[] }>,
              ) => ({
                color: singleFill,
                name: '',
                value:
                  d[
                    (displayConfig as Record<string, unknown>)[
                      'yField'
                    ] as string
                  ],
              }),
            ],
          },
        }
      : {}),
    state: {
      active: { fill: activeFill },
      inactive: {},
    },
  } as ColumnConfig;

  const hasHeader = !!(chartTitle || showViewToggle);
  const legendItems =
    colorField && domain.length
      ? domain.map((label, i) => ({
          label,
          color: range[i % range.length] ?? '#3B82F6',
        }))
      : [];

  return (
    <div className={mergeCss(['flex flex-col w-full', className])}>
      {hasHeader && (
        <div className="flex flex-col flex-shrink-0 mb-[30px] pl-10">
          <div className="flex items-center justify-between">
            {chartTitle ? (
              <span
                className="text-xl font-semibold leading-7 text-gray-900"
                style={{ fontFamily: FONT_FAMILY }}
              >
                {chartTitle}
              </span>
            ) : (
              <span />
            )}
            {showViewToggle && (
              <div className="flex bg-gray-100 rounded-full p-1 gap-0.5">
                {(['count', 'percentage'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={mergeCss([
                      'text-sm font-medium px-4 py-1.5 rounded-full border-none cursor-pointer transition-all',
                      viewMode === mode
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-transparent text-gray-500',
                    ])}
                    style={{ fontFamily: FONT_FAMILY }}
                  >
                    {mode === 'count' ? 'Count' : 'Percentage'}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Always rendered so charts without a legend keep the same
              title-to-plot gap as charts that have one. */}
          <div
            className="flex flex-wrap mt-5 text-xs gap-x-6 gap-y-1 min-h-[20px]"
            style={{ color: '#747A82', fontFamily: FONT_FAMILY }}
          >
            {legendItems.map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ background: color }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
      <div
        ref={chartContainerRef}
        className={chartHeight ? undefined : 'flex-1 min-h-0'}
        style={chartHeight ? { height: chartHeight } : undefined}
      >
        {/* Remount only when viewMode changes; rely on autoFit for resize instead of resizeKey */}
        <Column key={viewMode} {...withState} />
      </div>
    </div>
  );
}

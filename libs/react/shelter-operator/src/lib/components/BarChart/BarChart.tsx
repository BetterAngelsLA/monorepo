import type { ColumnConfig } from '@ant-design/plots';
import { Column } from '@ant-design/plots';
import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';
import { mergeDeep } from 'remeda';
const FONT_FAMILY = "'Poppins', ui-sans-serif, system-ui, sans-serif";
const RESIZE_DEBOUNCE_MS = 150;
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
};

export function BarChart({
  className,
  chartTitle,
  showViewToggle,
  onViewChange,
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
    config as Record<string, unknown>
  ) as ColumnConfig;

  const viewOverrides = onViewChange?.(viewMode) ?? {};
  const displayConfig = mergeDeep(
    mergedConfig as Record<string, unknown>,
    viewOverrides as Record<string, unknown>
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
    (colorField
      ? Array.from(new Set(data.map((d) => String(d[colorField]))))
      : []);
  const singleFill =
    ((cfg['style'] as { fill?: string } | undefined)?.fill as string) ??
    '#3B82F6';

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
    ...(!colorField
      ? {
          tooltip: {
            ...(displayConfig.tooltip as object | undefined),
            items: [
              (
                d: Record<string, unknown>,
                _index: number,
                _data: unknown[],
                _column: Record<string, { values: unknown[] }>
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
    <div className={clsx('flex flex-col w-full', className)}>
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
                    className={clsx(
                      'text-sm font-medium px-4 py-1.5 rounded-full border-none cursor-pointer transition-all',
                      viewMode === mode
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-transparent text-gray-500'
                    )}
                    style={{ fontFamily: FONT_FAMILY }}
                  >
                    {mode === 'count' ? 'Count' : 'Percentage'}
                  </button>
                ))}
              </div>
            )}
          </div>
          {legendItems.length > 0 && (
            <div
              className="flex flex-wrap mt-5 text-xs gap-x-6 gap-y-1"
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
          )}
        </div>
      )}
      <div ref={chartContainerRef} className="flex-1 min-h-0">
        {/* Remount only when viewMode changes; rely on autoFit for resize instead of resizeKey */}
        <Column key={viewMode} {...withState} />
      </div>
    </div>
  );
}

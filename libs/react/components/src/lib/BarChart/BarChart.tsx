import type { ColumnConfig } from '@ant-design/plots';
import { Column } from '@ant-design/plots';
import { useEffect, useState } from 'react';
const FONT_FAMILY = "'Poppins', ui-sans-serif, system-ui, sans-serif";
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
  const [fontsReady, setFontsReady] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('count');
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) {
      setFontsReady(true);
      return;
    }
    let active = true;
    document.fonts.ready.then(() => {
      if (active) setFontsReady(true);
    });
    return () => {
      active = false;
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

  const defaultAxis = (defaultConfig.axis ?? {}) as {
    x?: object;
    y?: object;
  };
  const configAxis = (config.axis ?? {}) as { x?: object; y?: object };

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    style: {
      ...(defaultConfig.style as object | undefined),
      ...(config.style as object | undefined),
    },
    axis: {
      ...defaultAxis,
      ...configAxis,
      x: { ...(defaultAxis.x ?? {}), ...(configAxis.x ?? {}) },
      y: { ...(defaultAxis.y ?? {}), ...(configAxis.y ?? {}) },
    },
  } as ColumnConfig;

  const viewOverrides = onViewChange?.(viewMode) ?? {};
  const displayConfig: ColumnConfig = {
    ...mergedConfig,
    ...viewOverrides,
    style: {
      ...(mergedConfig.style as object | undefined),
      ...(viewOverrides.style as object | undefined),
    },
    axis: {
      ...(mergedConfig.axis as object | undefined),
      ...(viewOverrides.axis as object | undefined),
      x: {
        ...((mergedConfig.axis as { x?: object } | undefined)?.x ?? {}),
        ...((viewOverrides.axis as { x?: object } | undefined)?.x ?? {}),
      },
      y: {
        ...((mergedConfig.axis as { y?: object } | undefined)?.y ?? {}),
        ...((viewOverrides.axis as { y?: object } | undefined)?.y ?? {}),
      },
    },
    scale: {
      ...(mergedConfig.scale as object | undefined),
      ...(viewOverrides.scale as object | undefined),
    },
  } as ColumnConfig;

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
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
    >
      {hasHeader && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            marginBottom: 30,
            paddingLeft: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {chartTitle ? (
              <span
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#111827',
                  lineHeight: '28px',
                }}
              >
                {chartTitle}
              </span>
            ) : (
              <span />
            )}
            {showViewToggle && (
              <div
                style={{
                  display: 'flex',
                  background: '#F3F4F6',
                  borderRadius: 9999,
                  padding: 4,
                  gap: 2,
                }}
              >
                {(['count', 'percentage'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: 14,
                      fontWeight: 500,
                      padding: '6px 16px',
                      borderRadius: 9999,
                      border: 'none',
                      cursor: 'pointer',
                      background: viewMode === mode ? '#ffffff' : 'transparent',
                      color: viewMode === mode ? '#111827' : '#6B7280',
                      boxShadow:
                        viewMode === mode
                          ? '0 1px 2px rgba(0,0,0,0.1)'
                          : 'none',
                    }}
                  >
                    {mode === 'count' ? 'Count' : 'Percentage'}
                  </button>
                ))}
              </div>
            )}
          </div>
          {legendItems.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 24px',
                marginTop: 20,
                fontFamily: FONT_FAMILY,
                fontSize: 12,
                color: '#747A82',
              }}
            >
              {legendItems.map(({ label, color }) => (
                <span
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Column
          key={`${viewMode}-${fontsReady ? 'fonts-ready' : 'fonts-loading'}`}
          {...withState}
        />
      </div>
    </div>
  );
}

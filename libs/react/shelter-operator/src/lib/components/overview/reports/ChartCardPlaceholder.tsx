import { Text } from '../../base-ui/text/text';

const cardClassName = 'rounded-xl border border-[#E5E7EB] bg-white p-5';

export type ChartLegendItem = { label: string; color: string };

/** Bed Status chart legend (placeholder) — replaced when the real chart lands. */
export const BED_STATUS_LEGEND: ChartLegendItem[] = [
  { label: 'Occupied', color: '#008CEE' },
  { label: 'Available', color: '#23CE6B' },
  { label: 'Reserved', color: '#F59E0B' },
  { label: 'Out of Service', color: '#EF4444' },
];

/** Visual-only Count/Percentage toggle. Non-interactive in this placeholder PR. */
function CountPercentageToggle() {
  return (
    <div
      className="inline-flex items-center rounded-full bg-[#F3F4F6] p-0.5"
      role="presentation"
      aria-hidden="true"
    >
      <span className="rounded-full px-3 py-1 text-sm text-[#6B7280]">
        Count
      </span>
      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#111827] shadow-sm">
        Percentage
      </span>
    </div>
  );
}

function ChartLegend({ items }: { items: ChartLegendItem[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <Text variant="caption" textColor="text-[#6B7280]">
            {item.label}
          </Text>
        </div>
      ))}
    </div>
  );
}

/**
 * Placeholder for a chart/graph box on the reporting Overview tab. Renders the
 * card shell (title, Count/Percentage toggle, optional legend, axis labels) with
 * a dashed plot region in place of the chart. Parametrized so it serves both the
 * Bed Status and Daily Occupancy boxes; swap the plot region for the real chart later.
 */
export function ChartCardPlaceholder({
  title,
  yAxisLabel,
  legend,
  testId,
}: {
  title: string;
  yAxisLabel: string;
  legend?: ChartLegendItem[];
  testId?: string;
}) {
  return (
    <section className={cardClassName} data-testid={testId}>
      <div className="flex items-start justify-between gap-3">
        <Text variant="body-bold" textColor="text-[#111827]">
          {title}
        </Text>
        <CountPercentageToggle />
      </div>

      {legend && <ChartLegend items={legend} />}

      <div className="mt-4 flex gap-2">
        <div className="flex items-center">
          <span
            className="text-xs text-[#9CA3AF]"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {yAxisLabel}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[#D1D5DB] bg-[#F9FAFB]">
            <Text variant="body" textColor="text-[#9CA3AF]">
              {title} chart placeholder
            </Text>
          </div>
          <div className="mt-2 text-center">
            <Text variant="caption" textColor="text-[#9CA3AF]">
              Date
            </Text>
          </div>
        </div>
      </div>
    </section>
  );
}

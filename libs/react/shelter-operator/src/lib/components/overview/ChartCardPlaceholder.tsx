import { Text } from '../base-ui/text/text';

const cardClassName =
  'rounded-[20px] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.06)]';

export type ChartLegendItem = { label: string; color: string };

/** Bed Status chart legend (placeholder) — replaced when the real chart lands. */
export const BED_STATUS_LEGEND: ChartLegendItem[] = [
  { label: 'Occupied', color: '#008CEE' },
  { label: 'Available', color: '#23CE6B' },
  { label: 'Reserved', color: '#F59E0B' },
  { label: 'Out of Service', color: '#EF4444' },
];

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
 * card shell (title, optional legend, axis labels) with a dashed plot region in
 * place of the chart. Parametrized so it serves both the Bed Status and Daily
 * Occupancy boxes.
 *
 * When wired up, the plot region is replaced by the BarChart component (#2162),
 * which owns the Count/Percentage view toggle (showViewToggle) and its own
 * title/legend — so no toggle is defined here.
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
      <Text variant="subheading" textColor="text-[#111827]">
        {title}
      </Text>

      {legend && <ChartLegend items={legend} />}

      <div className="mt-5 flex gap-2">
        <div className="flex items-center">
          <span
            className="text-xs text-[#9CA3AF]"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {yAxisLabel}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex min-h-[340px] items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB]">
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

import { useAtomValue } from 'jotai';
import { Calendar, ChevronDown, Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../base-ui/buttons/buttons';
import { Text } from '../base-ui/text/text';
import { dateRangeFilterAtom, type DateRange } from '../date-range-filter';
import { ExportDataModal } from './ExportDataModal';
import { useShelterMetricsExport } from './useShelterMetricsExport';

const fieldClassName =
  'flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2';

/** Placeholder for the date-range filter — replaced by the real filtering component later. */
function DateRangeFilterPlaceholder() {
  return (
    <div className={fieldClassName} aria-hidden="true">
      <Text variant="body" textColor="text-[#9CA3AF]">
        YYYY-MM-DD – YYYY-MM-DD
      </Text>
      <Calendar size={18} className="text-[#6B7280]" />
    </div>
  );
}

/** Placeholder for the date-range preset dropdown (e.g. "Last 30 Days"). */
function DatePresetPlaceholder() {
  return (
    <div className={fieldClassName} aria-hidden="true">
      <Text variant="body" textColor="text-[#6B7280]">
        Last 30 Days
      </Text>
      <ChevronDown size={18} className="text-[#6B7280]" />
    </div>
  );
}

function rangeLabel({ from, to }: DateRange): string {
  if (!from || !to) {
    return 'the default range';
  }

  const format = (date: Date) =>
    date.toLocaleDateString('en-US', { dateStyle: 'medium' });

  return `${format(from)} – ${format(to)}`;
}

/**
 * Top toolbar of the reporting Overview tab: date-range + preset filters on the
 * left, export on the right. The date controls are still placeholders; the
 * range itself comes from `dateRangeFilterAtom`, the same one the charts use.
 */
export function ReportFilterBar({ shelterId }: { shelterId?: string }) {
  const { range } = useAtomValue(dateRangeFilterAtom);
  const { exportMetrics, isExporting } = useShelterMetricsExport();
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeFilterPlaceholder />
        <DatePresetPlaceholder />
      </div>

      <Button
        variant="primary"
        leftIcon={<Download size={20} color="black" />}
        rightIcon={false}
        className="text-black"
        disabled={!shelterId}
        onClick={() => setIsExportOpen(true)}
      >
        Export Data
      </Button>

      {shelterId && (
        <ExportDataModal
          isOpen={isExportOpen}
          isExporting={isExporting}
          rangeLabel={rangeLabel(range)}
          onClose={() => setIsExportOpen(false)}
          onExport={async (format, metrics) => {
            await exportMetrics({ shelterId, range, format, metrics });
            setIsExportOpen(false);
          }}
        />
      )}
    </div>
  );
}

import { useAtom } from 'jotai';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../base-ui/buttons/buttons';
import {
  DateRangeFilter,
  dateRangeFilterAtom,
  type DateRange,
} from '../date-range-filter';
import { ExportDataModal } from './ExportDataModal';
import { useShelterMetricsExport } from './useShelterMetricsExport';

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
 * left, export on the right. The range comes from `dateRangeFilterAtom`, the
 * same one the charts use.
 */
export function ReportFilterBar({ shelterId }: { shelterId?: string }) {
  const [{ preset, range }, setFilter] = useAtom(dateRangeFilterAtom);
  const { exportMetrics, isExporting } = useShelterMetricsExport();
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <DateRangeFilter
        presetClassName="w-56"
        pickerClassName="w-80"
        value={range}
        preset={preset}
        onChange={(nextRange, nextPreset) => {
          // Reports has no "All time" entry, so `ALL` is unreachable here; the
          // atom's state shape stays date-range-only.
          if (nextPreset === 'ALL') {
            return;
          }

          setFilter({
            preset: nextPreset,
            range: nextRange,
          });
        }}
      />

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

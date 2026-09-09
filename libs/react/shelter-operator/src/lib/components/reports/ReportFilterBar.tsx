import { useAtom } from 'jotai';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../base-ui/buttons/buttons';
import {
  DateRangeCalendar,
  DateRangePresetDropdown,
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
  const [{ range }, setFilter] = useAtom(dateRangeFilterAtom);
  const { exportMetrics, isExporting } = useShelterMetricsExport();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [previewCustom, setPreviewCustom] = useState(false);

  function handleCalendarOpenChange(open: boolean) {
    setIsCalendarOpen(open);
    if (!open) setPreviewCustom(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeCalendar
          className="w-80"
          value={range}
          open={isCalendarOpen}
          onOpenChange={handleCalendarOpenChange}
          onDirty={() => setPreviewCustom(true)}
          onCommit={(next) => {
            setFilter({ preset: 'CUSTOM', range: next });
            setPreviewCustom(false);
          }}
        />
        <DateRangePresetDropdown
          className="w-56"
          displayPreset={previewCustom ? 'CUSTOM' : undefined}
          onCustomSelected={() => handleCalendarOpenChange(true)}
        />
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

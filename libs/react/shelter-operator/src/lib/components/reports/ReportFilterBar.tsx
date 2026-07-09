import { Calendar, ChevronDown, Download } from 'lucide-react';
import { Button } from '../base-ui/buttons/buttons';
import { Text } from '../base-ui/text/text';

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

/** Placeholder for the export action — replaced by the real export flow later. */
function ExportDataButtonPlaceholder() {
  return (
    <Button
      variant="primary"
      leftIcon={<Download size={20} color="black" />}
      rightIcon={false}
      className="text-black opacity-50 pointer-events-none"
      aria-disabled
    >
      Export Data
    </Button>
  );
}

/**
 * Top toolbar of the reporting Overview tab: date-range + preset filters on the
 * left, export on the right. All controls are non-interactive placeholders.
 */
export function ReportFilterBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeFilterPlaceholder />
        <DatePresetPlaceholder />
      </div>
      <ExportDataButtonPlaceholder />
    </div>
  );
}

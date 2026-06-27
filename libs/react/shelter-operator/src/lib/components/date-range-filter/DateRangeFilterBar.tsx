import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../base-ui/buttons';
import { DateRangeCalendar } from './DateRangeCalendar';
import { dateRangeFilterAtom } from './dateRangeFilterAtom';
import { DateRangePresetDropdown } from './DateRangePresetDropdown';

export interface DateRangeFilterBarProps {
  /**
   * Export Data behavior is a separate feature
   * (docs/handoff-client-pdf-export.md). Until it lands the button is disabled.
   */
  onExportData?: () => void;
  className?: string;
}

/**
 * Overview reporting toolbar: an always-visible custom-range field on the left,
 * the presets dropdown to its right, and Export Data on the far right — all
 * driven by one shared atom (single source of truth). Clicking the field (or
 * picking "Custom" in the dropdown) opens the calendar; committing a range
 * flips the preset to "Custom". Picking a named preset updates the range the
 * field shows. The field is always visible and seeded from the active range
 * (default: Last 30 Days).
 */
export function DateRangeFilterBar({
  onExportData,
  className,
}: DateRangeFilterBarProps) {
  const [filter, setFilter] = useAtom(dateRangeFilterAtom);
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Preview "Custom" in the dropdown the moment the user starts editing a
  // calendar draft, before Save. Dropped if the popover closes without saving
  // (the draft itself is discarded too), so the preset reverts to its committed
  // value.
  const [previewCustom, setPreviewCustom] = useState(false);

  function handleCalendarOpenChange(open: boolean) {
    setCalendarOpen(open);
    if (!open) setPreviewCustom(false);
  }

  return (
    <div
      className={mergeCss([
        'flex items-center justify-between gap-3 font-sans',
        className,
      ])}
    >
      <div className="flex items-center gap-3">
        <DateRangeCalendar
          className="w-80"
          value={filter.range}
          open={calendarOpen}
          onOpenChange={handleCalendarOpenChange}
          onDirty={() => setPreviewCustom(true)}
          onCommit={(range) => {
            setFilter({ preset: 'CUSTOM', range });
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
        leftIcon={<Upload size={20} color="black" />}
        rightIcon={false}
        className="text-black"
        disabled={!onExportData}
        onClick={onExportData}
      >
        Export Data
      </Button>
    </div>
  );
}

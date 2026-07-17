import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../base-ui/buttons';
import { DateRangeCalendar } from './DateRangeCalendar';
import { dateRangeFilterAtom } from './dateRangeFilterAtom';
import { DateRangePresetDropdown } from './DateRangePresetDropdown';

export interface DateRangeFilterBarProps {
  onExportData?: () => void;
  className?: string;
}

export function DateRangeFilterBar({
  onExportData,
  className,
}: DateRangeFilterBarProps) {
  const [filter, setFilter] = useAtom(dateRangeFilterAtom);
  const [calendarOpen, setCalendarOpen] = useState(false);
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

import { endOfDay, startOfDay } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import type { ObjectAuditLogFilters } from '../../hooks';
import { Dropdown, type DropdownOption } from '../base-ui/dropdown';
import {
  DateRangePicker,
  PRESET_LABELS,
  resolvePreset,
  type DateRange,
  type DateRangePreset,
} from '../date-range-filter';

type AuditDatePreset = 'ALL' | DateRangePreset;

const DATE_PRESET_OPTIONS: ReadonlyArray<DropdownOption<AuditDatePreset>> = [
  { value: 'ALL', label: 'All time' },
  ...(Object.entries(PRESET_LABELS) as Array<[DateRangePreset, string]>).map(
    ([value, label]) => ({ value, label }),
  ),
];

function rangeToFilters(range: DateRange): ObjectAuditLogFilters {
  return {
    dateFrom: range.from ? startOfDay(range.from).toISOString() : null,
    dateTo: range.to ? endOfDay(range.to).toISOString() : null,
  };
}

/**
 * Date-range filters for the audit log. Emits the derived
 * `dateFrom`/`dateTo` filter object on every change.
 */
export function AuditFilterBar({
  onChange,
}: {
  onChange: (filters: ObjectAuditLogFilters) => void;
}) {
  const [preset, setPreset] = useState<AuditDatePreset>('ALL');
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [previewCustom, setPreviewCustom] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const presetValue = useMemo(() => {
    const value = previewCustom ? 'CUSTOM' : preset;

    return DATE_PRESET_OPTIONS.find((option) => option.value === value) ?? null;
  }, [preset, previewCustom]);

  const handlePresetChange = useCallback(
    (option: DropdownOption<AuditDatePreset> | null) => {
      const next = option?.value ?? 'ALL';

      if (next === 'CUSTOM') {
        setPreviewCustom(true);
        setIsPickerOpen(true);
        return;
      }

      const nextRange: DateRange =
        next === 'ALL' ? { from: null, to: null } : resolvePreset(next);

      setPreset(next);
      setPreviewCustom(false);
      setRange(nextRange);
      setIsPickerOpen(false);
      onChange(rangeToFilters(nextRange));
    },
    [onChange],
  );

  const handlePickerOpenChange = useCallback((isOpen: boolean) => {
    setIsPickerOpen(isOpen);
    if (!isOpen) {
      setPreviewCustom(false);
    }
  }, []);

  const handlePickerCommit = useCallback(
    (next: DateRange) => {
      setPreset('CUSTOM');
      setPreviewCustom(false);
      setRange(next);
      setIsPickerOpen(false);
      onChange(rangeToFilters(next));
    },
    [onChange],
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-56">
        <Dropdown
          label="Date range"
          options={DATE_PRESET_OPTIONS}
          value={presetValue}
          onChange={handlePresetChange}
        />
      </div>

      <DateRangePicker
        className="w-80"
        value={range}
        open={isPickerOpen}
        onOpenChange={handlePickerOpenChange}
        onDirty={() => setPreviewCustom(true)}
        onCommit={handlePickerCommit}
      />
    </div>
  );
}

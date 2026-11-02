import { useCallback, useMemo, useState } from 'react';
import type { ObjectAuditLogFilters } from '../../hooks';
import {
  Dropdown,
  toDropdownOptions,
  type DropdownOption,
} from '../base-ui/dropdown';
import {
  DateRangePicker,
  PRESET_LABELS,
  type DateRange,
} from '../date-range-filter';
import {
  DEFAULT_AUDIT_PRESET,
  presetRange,
  rangeToFilters,
  type AuditDatePreset,
} from './auditFilters';

const DATE_PRESET_OPTIONS: ReadonlyArray<DropdownOption<AuditDatePreset>> = [
  { value: 'ALL', label: 'All time' },
  ...toDropdownOptions(PRESET_LABELS),
];

/**
 * Date-range filters for the audit log. Emits the derived
 * `dateFrom`/`dateTo` filter object on every change.
 *
 * The bar opens on {@link DEFAULT_AUDIT_PRESET}, and the caller seeds its own
 * filter state from the same constant, so the label is never out of step with
 * the query. Uncommitted calendar edits only preview "Custom".
 */
export function AuditFilterBar({
  onChange,
}: {
  onChange: (filters: ObjectAuditLogFilters) => void;
}) {
  const [preset, setPreset] = useState<AuditDatePreset>(DEFAULT_AUDIT_PRESET);
  const [range, setRange] = useState<DateRange>(() =>
    presetRange(DEFAULT_AUDIT_PRESET),
  );
  const [previewCustom, setPreviewCustom] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const presetValue = useMemo(() => {
    const value = previewCustom ? 'CUSTOM' : preset;

    return DATE_PRESET_OPTIONS.find((option) => option.value === value) ?? null;
  }, [preset, previewCustom]);

  const handlePresetChange = useCallback(
    (option: DropdownOption<AuditDatePreset> | null) => {
      // The dropdown toggles: clicking the selected preset clears it back to
      // "All time", the unfiltered view.
      const next = option?.value ?? 'ALL';

      if (next === 'CUSTOM') {
        setPreviewCustom(true);
        setIsPickerOpen(true);
        return;
      }

      const nextRange = presetRange(next);

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

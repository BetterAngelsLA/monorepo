import { useCallback, useState } from 'react';
import type { ObjectAuditLogFilters } from '../../hooks';
import {
  DateRangeFilter,
  resolvePresetValue,
  type DateRange,
  type DateRangePresetValue,
} from '../date-range-filter';
import { DEFAULT_AUDIT_PRESET, rangeToFilters } from './auditFilters';

/**
 * Date-range filters for the audit log. Emits the derived
 * `dateFrom`/`dateTo` filter object on every change.
 *
 * The caller passes the preset and range it seeded its query with, so the bar
 * and the query come from one clock read. The props default to
 * {@link DEFAULT_AUDIT_PRESET} for standalone use.
 */
export function AuditFilterBar({
  onChange,
  initialPreset = DEFAULT_AUDIT_PRESET,
  initialRange,
}: {
  onChange: (filters: ObjectAuditLogFilters) => void;
  /** Preset the caller seeded its filters with. */
  initialPreset?: DateRangePresetValue;
  /** Range the caller's filters represent; resolved from the preset if absent. */
  initialRange?: DateRange;
}) {
  const [preset, setPreset] = useState<DateRangePresetValue>(initialPreset);
  const [range, setRange] = useState<DateRange>(
    () => initialRange ?? resolvePresetValue(initialPreset),
  );

  const handleChange = useCallback(
    (nextRange: DateRange, nextPreset: DateRangePresetValue) => {
      setRange(nextRange);
      setPreset(nextPreset);
      onChange(rangeToFilters(nextRange));
    },
    [onChange],
  );

  return (
    <DateRangeFilter
      includeAll
      presetAriaLabel="Date range"
      presetClassName="w-56"
      pickerClassName="w-80"
      value={range}
      preset={preset}
      onChange={handleChange}
    />
  );
}

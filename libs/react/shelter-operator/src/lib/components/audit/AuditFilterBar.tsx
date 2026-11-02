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
 * The bar opens on {@link DEFAULT_AUDIT_PRESET}, and the caller seeds its own
 * filter state from the same constant, so the label is never out of step with
 * the query.
 */
export function AuditFilterBar({
  onChange,
}: {
  onChange: (filters: ObjectAuditLogFilters) => void;
}) {
  const [preset, setPreset] =
    useState<DateRangePresetValue>(DEFAULT_AUDIT_PRESET);
  const [range, setRange] = useState<DateRange>(() =>
    resolvePresetValue(DEFAULT_AUDIT_PRESET),
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
      presetClassName="w-56"
      pickerClassName="w-80"
      value={range}
      preset={preset}
      onChange={handleChange}
    />
  );
}

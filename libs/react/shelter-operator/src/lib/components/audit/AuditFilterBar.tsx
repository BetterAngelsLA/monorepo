import type { AuditTargetType } from '@monorepo/ba-platform/types';
import { useCallback, useState } from 'react';
import type { ObjectAuditLogFilters } from '../../hooks';
import {
  DateRangeFilter,
  resolvePresetValue,
  type DateRange,
  type DateRangePresetValue,
} from '../date-range-filter';
import { ActorFilter } from './ActorFilter';
import {
  DEFAULT_AUDIT_PRESET,
  rangeToFilters,
  type AuditActorSelection,
} from './auditFilters';

/**
 * Date-range and actor filters for the audit log. Emits the derived
 * `dateFrom`/`dateTo`/`actorId`/`systemOnly` filter object on every change.
 *
 * All filter state belongs to the caller: it seeds the range from one clock
 * read, owns the actor selection, and can therefore reset both together when
 * the log's target changes. Only the range the user is currently looking at
 * stays local. The date props default to {@link DEFAULT_AUDIT_PRESET} for
 * standalone use.
 */
export function AuditFilterBar({
  targetType,
  objectId,
  onChange,
  actorSelection,
  onActorSelectionChange,
  initialPreset = DEFAULT_AUDIT_PRESET,
  initialRange,
}: {
  targetType: AuditTargetType;
  objectId: string;
  onChange: (filters: ObjectAuditLogFilters) => void;
  /** The committed actor filter, owned by the caller so it resets with the target. */
  actorSelection: AuditActorSelection | null;
  /** Emitted when the actor search commits or clears a selection. */
  onActorSelectionChange: (selection: AuditActorSelection | null) => void;
  /** Preset the caller seeded its filters with. */
  initialPreset?: DateRangePresetValue;
  /** Range the caller's filters represent; resolved from the preset if absent. */
  initialRange?: DateRange;
}) {
  const [preset, setPreset] = useState<DateRangePresetValue>(initialPreset);
  const [range, setRange] = useState<DateRange>(
    () => initialRange ?? resolvePresetValue(initialPreset),
  );

  const handleRangeChange = useCallback(
    (nextRange: DateRange, nextPreset: DateRangePresetValue) => {
      setRange(nextRange);
      setPreset(nextPreset);
      onChange(rangeToFilters(nextRange, actorSelection));
    },
    [actorSelection, onChange],
  );

  const handleActorChange = useCallback(
    (next: AuditActorSelection | null) => {
      onActorSelectionChange(next);
      // The range is already on screen; only the actor dimension moved.
      onChange(rangeToFilters(range, next));
    },
    [onChange, onActorSelectionChange, range],
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <DateRangeFilter
        includeAll
        presetAriaLabel="Date range"
        presetClassName="w-56"
        pickerClassName="w-80"
        value={range}
        preset={preset}
        onChange={handleRangeChange}
      />

      <ActorFilter
        targetType={targetType}
        objectId={objectId}
        selection={actorSelection}
        onChange={handleActorChange}
      />
    </div>
  );
}

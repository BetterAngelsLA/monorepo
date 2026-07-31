import { ConditionChoices } from '@monorepo/react/shelter';
import { Trash2 } from 'lucide-react';
import { Dropdown, type DropdownOption } from '../../../../../base-ui/dropdown';
import type { ExceptionEntry } from '../types';
import { TimeRangeInput } from '../WeeklyScheduleEditor/TimeRangeInput';
import { DateOrRangePicker } from './DateOrRangePicker';

const CONDITION_LABELS: Record<ConditionChoices, string> = {
  [ConditionChoices.Heat]: 'Heat',
  [ConditionChoices.RainSevereWeather]: 'Rain / Severe Weather',
  [ConditionChoices.Wind]: 'Wind',
  [ConditionChoices.Fire]: 'Fire',
  [ConditionChoices.AirQualitySmoke]: 'Air Quality / Smoke',
  [ConditionChoices.EmergencyEvacuation]: 'Emergency Evacuation',
  [ConditionChoices.PublicHealthEmergency]: 'Public Health Emergency',
};

const CONDITION_OPTIONS: DropdownOption<ConditionChoices>[] = Object.entries(
  CONDITION_LABELS
).map(([value, label]) => ({ value: value as ConditionChoices, label }));

export type ExceptionErrors = {
  startDate?: { message?: string };
  endDate?: { message?: string };
  startTime?: { message?: string };
  endTime?: { message?: string };
};

type TProps = {
  entry: ExceptionEntry;
  onChange: (patch: Partial<ExceptionEntry>) => void;
  onRemove: () => void;
  errors?: ExceptionErrors;
  disabled?: boolean;
};

export function ExceptionRow(props: TProps) {
  const { entry, onChange, onRemove, errors, disabled } = props;

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-amber-900">Exception</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-amber-600 hover:text-red-600 transition-colors"
          aria-label="Remove exception"
          disabled={disabled}
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Date / date range */}
      <DateOrRangePicker
        startDate={entry.startDate}
        endDate={entry.endDate}
        onChange={(field, value) => onChange({ [field]: value })}
        disabled={disabled}
      />

      {(errors?.startDate || errors?.endDate) && (
        <span className="text-xs text-red-600">
          {errors?.startDate?.message || errors?.endDate?.message}
        </span>
      )}

      {/* Closed all day toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`closed-${entry.localId}`}
          checked={entry.closedAllDay}
          onChange={(e) => onChange({ closedAllDay: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          disabled={disabled}
        />
        <label
          htmlFor={`closed-${entry.localId}`}
          className="text-sm text-gray-700"
        >
          Closed all day
        </label>
      </div>

      {/* Time range (hidden when closed all day) */}
      {!entry.closedAllDay && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-14">Hours</span>
          <TimeRangeInput
            startTime={entry.startTime}
            endTime={entry.endTime}
            onChange={(field, value) => onChange({ [field]: value })}
            error={errors?.startTime?.message || errors?.endTime?.message}
            disabled={disabled}
          />
        </div>
      )}

      {/* Optional condition */}
      <Dropdown
        label="Condition (optional)"
        options={CONDITION_OPTIONS}
        value={
          entry.condition
            ? CONDITION_OPTIONS.find((o) => o.value === entry.condition) ?? null
            : null
        }
        onChange={(opt) => onChange({ condition: opt?.value ?? undefined })}
        placeholder="None"
        disabled={disabled}
        className="w-56"
      />
    </div>
  );
}

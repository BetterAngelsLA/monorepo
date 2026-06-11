import { ConditionChoices } from '@monorepo/react/shelter';
import { Trash2 } from 'lucide-react';
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
};

export function ExceptionRow(props: TProps) {
  const { entry, onChange, onRemove, errors } = props;

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-amber-900">Exception</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-amber-600 hover:text-red-600 transition-colors"
          aria-label="Remove exception"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Date / date range */}
      <DateOrRangePicker
        startDate={entry.startDate}
        endDate={entry.endDate}
        onChange={(field, value) => onChange({ [field]: value })}
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
          />
        </div>
      )}

      {/* Optional condition */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Condition (optional)</label>
        <select
          value={entry.condition ?? ''}
          onChange={(e) =>
            onChange({
              condition: (e.target.value as ConditionChoices) || undefined,
            })
          }
          className="w-56 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">None</option>
          {Object.entries(CONDITION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

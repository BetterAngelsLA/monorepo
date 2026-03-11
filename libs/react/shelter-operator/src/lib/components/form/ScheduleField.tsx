import { DayOfWeekChoices, ScheduleTypeChoices } from '@monorepo/react/shelter';
import { Plus, Trash2 } from 'lucide-react';
import { memo, useCallback } from 'react';
import type { ScheduleFormEntry } from '../../pages/dashboard/formTypes';
import { FieldWrapper } from './FieldWrapper';
import { INPUT_CLASS } from './styles';

const DAYS: { value: DayOfWeekChoices; label: string }[] = [
  { value: DayOfWeekChoices.Monday, label: 'Monday' },
  { value: DayOfWeekChoices.Tuesday, label: 'Tuesday' },
  { value: DayOfWeekChoices.Wednesday, label: 'Wednesday' },
  { value: DayOfWeekChoices.Thursday, label: 'Thursday' },
  { value: DayOfWeekChoices.Friday, label: 'Friday' },
  { value: DayOfWeekChoices.Saturday, label: 'Saturday' },
  { value: DayOfWeekChoices.Sunday, label: 'Sunday' },
];

const SCHEDULE_TYPES: { value: ScheduleTypeChoices; label: string }[] = [
  { value: ScheduleTypeChoices.Operating, label: 'Operating Hours' },
  { value: ScheduleTypeChoices.Intake, label: 'Intake Hours' },
  { value: ScheduleTypeChoices.MealService, label: 'Meal Service' },
  { value: ScheduleTypeChoices.StaffAvailability, label: 'Staff Availability' },
];

function createEmptyEntry(): ScheduleFormEntry {
  return {
    scheduleType: ScheduleTypeChoices.Operating,
    days: [],
    startTime: '',
    endTime: '',
    startDate: '',
    endDate: '',
    condition: '',
    isException: false,
  };
}

interface ScheduleFieldProps {
  id: string;
  label: string;
  value: ScheduleFormEntry[];
  onChange: (value: ScheduleFormEntry[]) => void;
  error?: string;
  helperText?: string;
}

export const ScheduleField = memo(function ScheduleField({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
}: ScheduleFieldProps) {
  const addEntry = useCallback(() => {
    onChange([...value, createEmptyEntry()]);
  }, [value, onChange]);

  const removeEntry = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const updateEntry = useCallback(
    (index: number, patch: Partial<ScheduleFormEntry>) => {
      const next = value.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry
      );
      onChange(next);
    },
    [value, onChange]
  );

  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      helperText={helperText}
      error={error}
    >
      <div className="space-y-3">
        {value.map((entry, index) => (
          <ScheduleRow
            key={index}
            id={`${id}-${index}`}
            entry={entry}
            onUpdate={(patch) => updateEntry(index, patch)}
            onRemove={() => removeEntry(index)}
          />
        ))}
        <button
          type="button"
          onClick={addEntry}
          className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800 font-medium"
        >
          <Plus size={16} />
          Add schedule entry
        </button>
      </div>
    </FieldWrapper>
  );
});

interface ScheduleRowProps {
  id: string;
  entry: ScheduleFormEntry;
  onUpdate: (patch: Partial<ScheduleFormEntry>) => void;
  onRemove: () => void;
}

const ScheduleRow = memo(function ScheduleRow({
  id,
  entry,
  onUpdate,
  onRemove,
}: ScheduleRowProps) {
  const toggleDay = useCallback(
    (day: DayOfWeekChoices) => {
      const next = entry.days.includes(day)
        ? entry.days.filter((d) => d !== day)
        : [...entry.days, day];
      onUpdate({ days: next });
    },
    [entry.days, onUpdate]
  );

  return (
    <div className="border border-gray-200 rounded-md p-3 space-y-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Schedule Entry
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
          aria-label="Remove schedule entry"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Schedule Type */}
      <div>
        <label
          htmlFor={`${id}-type`}
          className="block text-xs font-medium text-gray-600 mb-1"
        >
          Type
        </label>
        <select
          id={`${id}-type`}
          value={entry.scheduleType}
          onChange={(e) =>
            onUpdate({ scheduleType: e.target.value as ScheduleTypeChoices })
          }
          className={INPUT_CLASS}
        >
          {SCHEDULE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Days of Week — multi-select checkboxes */}
      <fieldset>
        <legend className="block text-xs font-medium text-gray-600 mb-1">
          Days (leave unchecked for every day)
        </legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <label
              key={d.value}
              className="flex items-center gap-1 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={entry.days.includes(d.value)}
                onChange={() => toggleDay(d.value)}
                className="rounded-sm border-gray-300 text-green-600 focus:ring-green-500"
              />
              {d.label.slice(0, 3)}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Time fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${id}-open`}
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Open Time
          </label>
          <input
            type="time"
            id={`${id}-open`}
            value={entry.startTime}
            onChange={(e) => onUpdate({ startTime: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label
            htmlFor={`${id}-close`}
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Close Time
          </label>
          <input
            type="time"
            id={`${id}-close`}
            value={entry.endTime}
            onChange={(e) => onUpdate({ endTime: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </div>
  );
});

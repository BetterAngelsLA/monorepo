import { DayOfWeekChoices } from '@monorepo/react/shelter';
import type { DayState, HoursMode, WeeklyFormState } from '../types';
import { DayRow, ORDERED_DAYS } from './DayRow';
import { HoursModeSelector } from './HoursModeSelector';
import { TimeRangeInput } from './TimeRangeInput';

// ─── Default state factory ────────────────────────────────────────────────────

export function buildDefaultWeeklyState(): WeeklyFormState {
  const dayHours = Object.fromEntries(
    Object.values(DayOfWeekChoices).map((day) => [
      day,
      { open: false, startTime: '', endTime: '' },
    ])
  ) as Record<DayOfWeekChoices, DayState>;

  return {
    mode: 'same',
    sameHours: { startTime: '', endTime: '' },
    dayHours,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

type TProps = {
  value: WeeklyFormState;
  onChange: (next: WeeklyFormState) => void;
};

export function WeeklyScheduleEditor(props: TProps) {
  const { value, onChange } = props;

  const setMode = (mode: HoursMode) => {
    onChange({ ...value, mode });
  };

  const setSameHours = (field: 'startTime' | 'endTime', time: string) => {
    onChange({
      ...value,
      sameHours: { ...value.sameHours, [field]: time },
    });
  };

  const setDayState = (day: DayOfWeekChoices, patch: Partial<DayState>) => {
    onChange({
      ...value,
      dayHours: {
        ...value.dayHours,
        [day]: { ...value.dayHours[day], ...patch },
      },
    });
  };

  return (
    <div className="space-y-5">
      <HoursModeSelector value={value.mode} onChange={setMode} />

      {value.mode === 'closed' && (
        <p className="text-sm text-gray-500 italic">
          No hours are configured for this schedule type.
        </p>
      )}

      {value.mode === 'same' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 w-28">
              Hours
            </span>
            <TimeRangeInput
              startTime={value.sameHours.startTime}
              endTime={value.sameHours.endTime}
              onChange={setSameHours}
            />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-1">
            <p className="text-xs text-gray-500 mb-2">
              Toggle each day on to apply these hours
            </p>
            {ORDERED_DAYS.map(({ value: day, label }) => (
              <DayRow
                key={day}
                day={day}
                label={label}
                state={{
                  ...value.dayHours[day],
                  startTime: value.sameHours.startTime,
                  endTime: value.sameHours.endTime,
                }}
                onChange={(patch) => setDayState(day, patch)}
                timeReadOnly
              />
            ))}
          </div>
        </div>
      )}

      {value.mode === 'mixed' && (
        <div className="space-y-1">
          {ORDERED_DAYS.map(({ value: day, label }) => (
            <DayRow
              key={day}
              day={day}
              label={label}
              state={value.dayHours[day]}
              onChange={(patch) => setDayState(day, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

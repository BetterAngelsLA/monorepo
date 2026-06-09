import { mergeCss } from '@monorepo/react/shared';
import { DayOfWeekChoices } from '@monorepo/react/shelter';
import type { DayState, WeeklyFormState } from '../types';
import { DayRow, ORDERED_DAYS } from './DayRow';
// ─── Day presets ─────────────────────────────────────────────────────────────

const WEEKDAYS = [
  DayOfWeekChoices.Monday,
  DayOfWeekChoices.Tuesday,
  DayOfWeekChoices.Wednesday,
  DayOfWeekChoices.Thursday,
  DayOfWeekChoices.Friday,
];
const WEEKEND = [DayOfWeekChoices.Saturday, DayOfWeekChoices.Sunday];
const ALL_DAYS = [...WEEKDAYS, ...WEEKEND];

const DAY_PRESETS: { label: string; days: DayOfWeekChoices[] }[] = [
  { label: 'Weekdays', days: WEEKDAYS },
  { label: 'Every day', days: ALL_DAYS },
  { label: 'Weekend', days: WEEKEND },
];

// ─── Component ────────────────────────────────────────────────────────────────

type TProps = {
  value: WeeklyFormState;
  onChange: (next: WeeklyFormState) => void;
};

export function WeeklyScheduleEditor(props: TProps) {
  const { value, onChange } = props;

  const setDay = (day: DayOfWeekChoices, patch: Partial<DayState>) => {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  };

  const applyPreset = (days: DayOfWeekChoices[]) => {
    // Toggle: if all preset days are already open, close them; otherwise open them
    const allOpen = days.every((d) => value[d].open);
    const next = { ...value };

    for (const d of days) {
      next[d] = { ...next[d], open: !allOpen };
    }

    onChange(next);
  };

  const copyToAll = (sourceDay: DayOfWeekChoices) => {
    const { startTime, endTime } = value[sourceDay];
    const next = { ...value };

    for (const d of Object.values(DayOfWeekChoices)) {
      if (next[d].open) {
        next[d] = { ...next[d], startTime, endTime };
      }
    }

    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Day preset strip */}
      <div className="flex gap-2">
        {DAY_PRESETS.map((preset) => {
          const allActive = preset.days.every((d) => value[d].open);

          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.days)}
              className={mergeCss([
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                allActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
              ])}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Day grid */}
      <div className="space-y-1">
        {ORDERED_DAYS.map(({ value: day, label }) => (
          <DayRow
            key={day}
            day={day}
            label={label}
            state={value[day]}
            onChange={(patch) => setDay(day, patch)}
            onCopyToAll={() => copyToAll(day)}
          />
        ))}
      </div>
    </div>
  );
}

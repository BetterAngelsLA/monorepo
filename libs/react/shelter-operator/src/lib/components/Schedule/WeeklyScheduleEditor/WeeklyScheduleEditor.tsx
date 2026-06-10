import { DayOfWeekChoices } from '@monorepo/react/shelter';
import { ORDERED_DAYS } from '../constants';
import type { DayState, WeeklyFormState } from '../types';
import { DayRow } from './DayRow';

type TProps = {
  value: WeeklyFormState;
  onChange: (next: WeeklyFormState) => void;
};

export function WeeklyScheduleEditor(props: TProps) {
  const { value, onChange } = props;

  const setDay = (day: DayOfWeekChoices, patch: Partial<DayState>) => {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
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
  );
}

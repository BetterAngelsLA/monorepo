import { DayOfWeekChoices } from '@monorepo/react/shelter';
import { ORDERED_DAYS } from '../constants';
import type { DaySchedule, WeeklyFormState } from '../types';
import { DayRow } from './DayRow';

type TProps = {
  value: WeeklyFormState;
  onChange: (next: WeeklyFormState) => void;
};

export function WeeklyScheduleEditor(props: TProps) {
  const { value, onChange } = props;

  const setDay = (day: DayOfWeekChoices, schedule: DaySchedule) => {
    onChange({ ...value, [day]: schedule });
  };

  const copyToAll = (sourceDay: DayOfWeekChoices) => {
    const sourceRanges = value[sourceDay].ranges;
    const next = { ...value };
    for (const d of Object.values(DayOfWeekChoices)) {
      if (d !== sourceDay) {
        next[d] = { ranges: sourceRanges.map((r) => ({ ...r })) };
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
          schedule={value[day]}
          onChange={(schedule) => setDay(day, schedule)}
          onCopyToAll={() => copyToAll(day)}
        />
      ))}
    </div>
  );
}

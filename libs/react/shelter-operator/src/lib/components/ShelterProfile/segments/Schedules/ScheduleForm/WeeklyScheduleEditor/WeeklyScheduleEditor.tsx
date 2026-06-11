import { DayOfWeekChoices } from '@monorepo/react/shelter';
import { ORDERED_DAYS } from '../constants';
import type { DayErrors, DaySchedule, WeeklyFormState } from '../types';
import { DayRow } from './DayRow';

type TProps = {
  value: WeeklyFormState;
  onChange: (next: WeeklyFormState, validate?: boolean) => void;
  errors?: Record<string, DayErrors>;
};

export function WeeklyScheduleEditor(props: TProps) {
  const { value, onChange, errors } = props;

  const setDay = (
    day: DayOfWeekChoices,
    schedule: DaySchedule,
    validate?: boolean
  ) => {
    onChange({ ...value, [day]: schedule }, validate);
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
          onChange={(schedule, validate) => setDay(day, schedule, validate)}
          onCopyToAll={() => copyToAll(day)}
          errors={errors?.[day]?.ranges}
        />
      ))}
    </div>
  );
}

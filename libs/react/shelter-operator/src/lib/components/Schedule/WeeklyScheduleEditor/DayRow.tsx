import { mergeCss } from '@monorepo/react/shared';
import { DayOfWeekChoices } from '@monorepo/react/shelter';
import type { DayState } from '../types';
import { TimeRangeInput } from './TimeRangeInput';

type TProps = {
  day: DayOfWeekChoices;
  label: string;
  state: DayState;
  onChange: (patch: Partial<DayState>) => void;
  /** When true the time inputs are rendered but disabled (same-hours mode fills them) */
  timeReadOnly?: boolean;
};

export function DayRow(props: TProps) {
  const { day: _day, label, state, onChange, timeReadOnly = false } = props;

  return (
    <div className="flex items-center gap-4 py-2">
      {/* Day toggle */}
      <button
        type="button"
        onClick={() => onChange({ open: !state.open })}
        className={mergeCss([
          'w-28 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors text-left',
          state.open
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400',
        ])}
        aria-pressed={state.open}
      >
        {label}
      </button>

      {state.open ? (
        <TimeRangeInput
          startTime={state.startTime}
          endTime={state.endTime}
          onChange={(field, value) => onChange({ [field]: value })}
          disabled={timeReadOnly}
        />
      ) : (
        <span className="text-sm text-gray-400 italic">Closed</span>
      )}
    </div>
  );
}

// ─── Ordered display list ─────────────────────────────────────────────────────

export const ORDERED_DAYS: { value: DayOfWeekChoices; label: string }[] = [
  { value: DayOfWeekChoices.Monday, label: 'Monday' },
  { value: DayOfWeekChoices.Tuesday, label: 'Tuesday' },
  { value: DayOfWeekChoices.Wednesday, label: 'Wednesday' },
  { value: DayOfWeekChoices.Thursday, label: 'Thursday' },
  { value: DayOfWeekChoices.Friday, label: 'Friday' },
  { value: DayOfWeekChoices.Saturday, label: 'Saturday' },
  { value: DayOfWeekChoices.Sunday, label: 'Sunday' },
];

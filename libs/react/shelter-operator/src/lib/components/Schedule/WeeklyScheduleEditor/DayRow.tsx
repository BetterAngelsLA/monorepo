import { mergeCss } from '@monorepo/react/shared';
import { DayOfWeekChoices } from '@monorepo/react/shelter';
import { CopyIcon } from 'lucide-react';
import { Button } from '../../base-ui/buttons';
import type { DayState } from '../types';
import { TimeRangeInput } from './TimeRangeInput';

type TProps = {
  day: DayOfWeekChoices;
  label: string;
  state: DayState;
  onChange: (patch: Partial<DayState>) => void;
  /** Called when the user wants to copy this row's times to all other open days */
  onCopyToAll?: () => void;
};

export function DayRow(props: TProps) {
  const { day: _day, label, state, onChange, onCopyToAll } = props;

  const canCopy = state.open && !!state.startTime && !!state.endTime;

  return (
    <div className="flex items-center gap-4 py-2">
      {/* Day toggle */}
      <Button
        variant="primary-sm"
        onClick={() => onChange({ open: !state.open })}
        className={mergeCss([
          'w-28 text-xs',
          state.open
            ? 'bg-[#008CEE] hover:bg-[#0071C0] border-[#008CEE] text-white'
            : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400',
        ])}
        aria-pressed={state.open}
      >
        {label}
      </Button>

      {state.open ? (
        <>
          <TimeRangeInput
            startTime={state.startTime}
            endTime={state.endTime}
            onChange={(field, value) => onChange({ [field]: value })}
          />
          {canCopy && onCopyToAll && (
            <button
              type="button"
              onClick={onCopyToAll}
              title="Copy these hours to all open days"
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <CopyIcon size={14} />
            </button>
          )}
        </>
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

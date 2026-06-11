import { mergeCss } from '@monorepo/react/shared';
import { DayOfWeekChoices } from '@monorepo/react/shelter';
import { CopyIcon, Plus, X } from 'lucide-react';
import { Button } from '../../../../../base-ui/buttons';
import type { DaySchedule, TimeRange, TimeRangeError } from '../types';
import { TimeRangeInput } from './TimeRangeInput';

const EMPTY_RANGE: TimeRange = { startTime: '', endTime: '' };

type TProps = {
  day: DayOfWeekChoices;
  label: string;
  schedule: DaySchedule;
  onChange: (schedule: DaySchedule, validate?: boolean) => void;
  /** Called when the user wants to copy this day's ranges to all other configured days */
  onCopyToAll?: () => void;
  errors?: TimeRangeError[];
};

export function DayRow(props: TProps) {
  const { day: _day, label, schedule, onChange, onCopyToAll, errors } = props;

  const hasRanges = schedule.ranges.length > 0;
  const canCopy =
    hasRanges && schedule.ranges.some((r) => r.startTime && r.endTime);

  const toggleDay = () => {
    onChange({ ranges: hasRanges ? [] : [{ ...EMPTY_RANGE }] });
  };

  const addRange = () => {
    onChange({ ranges: [...schedule.ranges, { ...EMPTY_RANGE }] }, false);
  };

  const updateRange = (index: number, patch: Partial<TimeRange>) => {
    onChange({
      ranges: schedule.ranges.map((r, i) =>
        i === index ? { ...r, ...patch } : r
      ),
    });
  };

  const removeRange = (index: number) => {
    const next = schedule.ranges.filter((_, i) => i !== index);
    onChange({ ranges: next });
  };

  return (
    <div className="flex items-start gap-4 py-2">
      {/* Day toggle */}
      <Button
        variant="primary-sm"
        onClick={toggleDay}
        className={mergeCss([
          'w-28 text-xs mt-0.5 shrink-0',
          hasRanges
            ? 'bg-[#008CEE] hover:bg-[#0071C0] border-[#008CEE] text-white'
            : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400',
        ])}
        aria-pressed={hasRanges}
      >
        {label}
      </Button>

      {hasRanges ? (
        <div className="flex flex-col gap-1.5">
          {schedule.ranges.map((range, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <TimeRangeInput
                  startTime={range.startTime}
                  endTime={range.endTime}
                  onChange={(field, value) =>
                    updateRange(index, { [field]: value })
                  }
                  error={
                    errors?.[index]?.startTime?.message ||
                    errors?.[index]?.endTime?.message
                  }
                />
                <button
                  type="button"
                  onClick={() => removeRange(index)}
                  title="Remove time range"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
                {index === 0 && canCopy && onCopyToAll && (
                  <button
                    type="button"
                    onClick={onCopyToAll}
                    title="Copy these hours to all days"
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <CopyIcon size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addRange}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors self-start"
          >
            <Plus size={12} />
            Add range
          </button>
        </div>
      ) : (
        <span className="text-sm text-gray-400 italic mt-0.5 self-center">
          Closed
        </span>
      )}
    </div>
  );
}

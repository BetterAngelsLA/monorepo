import { addDays, format, parseISO } from 'date-fns';
import { useRef } from 'react';
import { Input } from '../../../../../base-ui/input';
import type { ExceptionEntry } from '../types';

type TDateField = Pick<ExceptionEntry, 'startDate' | 'endDate' | 'isDateRange'>;

type TProps = {
  isDateRange: boolean;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  onChange: (patch: Partial<TDateField>) => void;
  disabled?: boolean;
};

/** The day after *date*, as a date-only string. */
function nextDay(date: string): string {
  return date ? format(addDays(parseISO(date), 1), 'yyyy-MM-dd') : '';
}

export function DateOrRangePicker(props: TProps) {
  const { isDateRange, startDate, endDate, onChange, disabled } = props;
  // The end date before the range was collapsed: toggling back should restore
  // what the user chose, not silently reset it to start + 1.
  const lastEndDate = useRef('');

  // A single-day exception is stored with endDate mirroring startDate, so the
  // payload stays complete while only one field is shown.
  const handleStartDateChange = (value: string) => {
    onChange(
      isDateRange ? { startDate: value } : { startDate: value, endDate: value },
    );
  };

  // Range mode is explicit: only this button changes it. Picking dates —
  // including equal start and end dates — never shows or hides the end field.
  const handleToggleRange = () => {
    if (isDateRange) {
      lastEndDate.current = endDate;
      onChange({ isDateRange: false, endDate: startDate });
      return;
    }

    const remembered = lastEndDate.current;
    onChange({
      isDateRange: true,
      endDate:
        remembered && remembered > startDate ? remembered : nextDay(startDate),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          dataType="date"
          label={isDateRange ? 'Start date' : 'Date'}
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          disabled={disabled}
          className="w-44"
        />

        {isDateRange && (
          <Input
            dataType="date"
            label="End date"
            value={endDate}
            min={startDate}
            onChange={(e) => {
              lastEndDate.current = e.target.value;
              onChange({ endDate: e.target.value });
            }}
            disabled={disabled}
            className="w-44"
          />
        )}
      </div>

      <button
        type="button"
        onClick={handleToggleRange}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
        disabled={disabled}
      >
        {isDateRange
          ? '— Remove end date (single day)'
          : '+ Add end date (date range)'}
      </button>
    </div>
  );
}

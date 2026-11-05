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

/** Adds days in UTC so a date-only value cannot shift across DST boundaries. */
function addDays(date: string, days: number): string {
  if (!date) return '';

  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);

  return next.toISOString().slice(0, 10);
}

export function DateOrRangePicker(props: TProps) {
  const { isDateRange, startDate, endDate, onChange, disabled } = props;

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
      onChange({ isDateRange: false, endDate: startDate });
    } else {
      onChange({ isDateRange: true, endDate: addDays(startDate, 1) });
    }
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
            onChange={(e) => onChange({ endDate: e.target.value })}
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

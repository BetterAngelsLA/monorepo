import { useRef } from 'react';
import { Input } from '../../../../../base-ui/input';

type TProps = {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  onChange: (field: 'startDate' | 'endDate', value: string) => void;
  disabled?: boolean;
};

export function DateOrRangePicker(props: TProps) {
  const { startDate, endDate, onChange, disabled } = props;

  const isSingleDay = !endDate || endDate === startDate;

  // Remembers the last end date before collapsing to single day,
  // so toggling back to range can restore it instead of recomputing startDate + 1.
  const savedEndDateRef = useRef<string>('');

  const handleSingleToggle = () => {
    if (isSingleDay) {
      // Restore saved end date if still after startDate, otherwise startDate + 1
      const saved = savedEndDateRef.current;
      if (saved && saved > startDate) {
        onChange('endDate', saved);
      } else if (startDate) {
        const next = new Date(startDate);
        next.setDate(next.getDate() + 1);
        onChange('endDate', next.toISOString().slice(0, 10));
      } else {
        onChange('endDate', '');
      }
    } else {
      // Save current end date before collapsing
      savedEndDateRef.current = endDate;
      onChange('endDate', startDate);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          dataType="date"
          label={isSingleDay ? 'Date' : 'Start date'}
          value={startDate}
          onChange={(e) => {
            onChange('startDate', e.target.value);
            if (isSingleDay) onChange('endDate', e.target.value);
          }}
          disabled={disabled}
          className="w-44"
        />

        {!isSingleDay && (
          <Input
            dataType="date"
            label="End date"
            value={endDate}
            min={startDate}
            onChange={(e) => onChange('endDate', e.target.value)}
            disabled={disabled}
            className="w-44"
          />
        )}
      </div>

      <button
        type="button"
        onClick={handleSingleToggle}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
        disabled={disabled}
      >
        {isSingleDay
          ? '+ Add end date (date range)'
          : '— Remove end date (single day)'}
      </button>
    </div>
  );
}

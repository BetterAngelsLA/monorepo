import { useId } from 'react';
import { Input } from '../../../../../base-ui/input';

type TimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
  describedBy?: string;
};

function TimeInput(props: TimeInputProps) {
  const { value, onChange, disabled = false, label, describedBy } = props;

  return (
    <Input
      dataType="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={label}
      aria-describedby={describedBy}
      className="min-w-36"
    />
  );
}

type TProps = {
  startTime: string;
  endTime: string;
  onChange: (field: 'startTime' | 'endTime', value: string) => void;
  disabled?: boolean;
  error?: string;
};

export function TimeRangeInput(props: TProps) {
  const { startTime, endTime, onChange, disabled = false, error } = props;

  // An end before the start is the next morning, not a mistake. Say so: without
  // this, "8:30 PM – 7:30 AM" is ambiguous to the person entering it. The note is
  // tied to the end field so it is read out with the value it explains.
  const crossesMidnight =
    startTime !== '' && endTime !== '' && endTime < startTime;
  const nextDayId = useId();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <TimeInput
          value={startTime}
          onChange={(value) => onChange('startTime', value)}
          disabled={disabled}
          label="Start time"
        />

        <span className="text-gray-500 text-sm">–</span>

        <TimeInput
          value={endTime}
          onChange={(value) => onChange('endTime', value)}
          disabled={disabled}
          label="End time"
          describedBy={crossesMidnight ? nextDayId : undefined}
        />

        {crossesMidnight && (
          <span
            id={nextDayId}
            className="text-xs text-gray-500 whitespace-nowrap"
          >
            Next day
          </span>
        )}
      </div>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

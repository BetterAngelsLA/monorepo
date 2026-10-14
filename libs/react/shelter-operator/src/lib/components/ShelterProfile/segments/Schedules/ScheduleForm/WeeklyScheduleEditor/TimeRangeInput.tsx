import { Input } from '../../../../../base-ui/input';

type TimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
};

function TimeInput(props: TimeInputProps) {
  const { value, onChange, disabled = false, label } = props;

  return (
    <Input
      dataType="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={label}
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
        />
      </div>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

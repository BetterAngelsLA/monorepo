type TimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
};

function TimeInput(props: TimeInputProps) {
  const { value, onChange, disabled = false, label } = props;

  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={label}
      className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
    />
  );
}

type TProps = {
  startTime: string;
  endTime: string;
  onChange: (field: 'startTime' | 'endTime', value: string) => void;
  disabled?: boolean;
};

export function TimeRangeInput(props: TProps) {
  const { startTime, endTime, onChange, disabled = false } = props;

  return (
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
  );
}

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
      <input
        type="time"
        value={startTime}
        onChange={(e) => onChange('startTime', e.target.value)}
        disabled={disabled}
        aria-label="Start time"
        className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
      />
      <span className="text-gray-500 text-sm">–</span>
      <input
        type="time"
        value={endTime}
        onChange={(e) => onChange('endTime', e.target.value)}
        disabled={disabled}
        aria-label="End time"
        className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
      />
    </div>
  );
}

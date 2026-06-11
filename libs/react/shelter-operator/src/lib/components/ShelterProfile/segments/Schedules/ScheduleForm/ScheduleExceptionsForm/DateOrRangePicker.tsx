type TProps = {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  onChange: (field: 'startDate' | 'endDate', value: string) => void;
  disabled?: boolean;
};

export function DateOrRangePicker(props: TProps) {
  const { startDate, endDate, onChange, disabled } = props;

  const isSingleDay = !endDate || endDate === startDate;

  const handleSingleToggle = () => {
    if (isSingleDay) {
      // Switch to range: set endDate to the day after startDate
      if (startDate) {
        const next = new Date(startDate);
        next.setDate(next.getDate() + 1);
        onChange('endDate', next.toISOString().slice(0, 10));
      } else {
        onChange('endDate', '');
      }
    } else {
      // Collapse back to single day
      onChange('endDate', startDate);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">
            {isSingleDay ? 'Date' : 'Start date'}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              onChange('startDate', e.target.value);
              // Keep single-day end in sync
              if (isSingleDay) onChange('endDate', e.target.value);
            }}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
        </div>

        {!isSingleDay && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">End date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => onChange('endDate', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>
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

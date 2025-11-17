import { useMemo } from 'react';
import { FieldWrapper } from './FieldWrapper';
import { INPUT_CLASS, INPUT_ERROR_CLASS } from '../constants/styles';

type Meridiem = 'AM' | 'PM';

type TimeParts = {
  hour: string;
  minute: string;
  meridiem: Meridiem;
};

type TimeRange = {
  start: TimeParts;
  end: TimeParts;
};

interface TimeRangeFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  error?: string;
}

const normalizeHour = (value: string): string => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return '';
  }
  const clamped = Math.min(12, Math.max(1, num));
  return String(clamped).padStart(2, '0');
};

const normalizeMinute = (value: string): string => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return '';
  }
  const clamped = Math.min(59, Math.max(0, num));
  return String(clamped).padStart(2, '0');
};

const toParts = (time: string): TimeParts => {
  const [hourRaw = '', minuteRaw = ''] = time.split(':');
  const hourNum = Number(hourRaw);
  if (Number.isNaN(hourNum)) {
    return { hour: '', minute: '', meridiem: 'AM' };
  }

  const minute = normalizeMinute(minuteRaw);
  const meridiem: Meridiem = hourNum >= 12 ? 'PM' : 'AM';
  const twelveHour = hourNum % 12 === 0 ? 12 : hourNum % 12;

  return {
    hour: String(twelveHour).padStart(2, '0'),
    minute,
    meridiem,
  };
};

const to24Hour = (parts: TimeParts): string => {
  if (!parts.hour || !parts.minute) {
    return '';
  }

  const hourNum = Number(parts.hour);
  if (Number.isNaN(hourNum)) {
    return '';
  }

  const isPm = parts.meridiem === 'PM';
  const twentyFour = (hourNum % 12) + (isPm ? 12 : 0);
  const paddedHour = String(twentyFour).padStart(2, '0');
  const paddedMinute = parts.minute.padStart(2, '0');

  return `${paddedHour}:${paddedMinute}:00`;
};

const parseRanges = (value: string): TimeRange[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map(token => token.trim())
    .filter(Boolean)
    .map(token => {
      const [startRaw = '', endRaw = ''] = token.split('-');
      return {
        start: toParts(startRaw),
        end: toParts(endRaw),
      };
    });
};

const serializeRanges = (ranges: TimeRange[]) =>
  ranges
    .map(range => ({
      start: to24Hour(range.start),
      end: to24Hour(range.end),
    }))
    .filter(range => range.start && range.end)
    .map(range => `${range.start}-${range.end}`)
    .join(',');

export function TimeRangeField({ id, name, label, value, onChange, helperText, error }: TimeRangeFieldProps) {
  const ranges = useMemo(() => {
    const parsed = parseRanges(value);
    return parsed.length ? parsed : [{ start: '', end: '' }];
  }, [value]);

  const messageId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined;

  const updateRange = (
    index: number,
    key: keyof TimeRange,
    part: keyof TimeParts,
    rawValue: string
  ) => {
    const nextRanges = ranges.map((range, idx) => {
      if (idx !== index) {
        return range;
      }

      const updater = part === 'hour' ? normalizeHour : part === 'minute' ? normalizeMinute : undefined;
      const nextValue = updater ? updater(rawValue) : rawValue;

      return {
        ...range,
        [key]: {
          ...range[key],
          [part]: nextValue,
        },
      };
    });

    onChange(serializeRanges(nextRanges));
  };

  const addRange = () => {
    onChange(serializeRanges([...ranges, { start: '', end: '' }]));
  };

  const removeRange = (index: number) => {
    const nextRanges = ranges.filter((_, idx) => idx !== index);
    onChange(serializeRanges(nextRanges.length ? nextRanges : [{ start: '', end: '' }]));
  };

  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      helperText={helperText}
      error={error}
      messageId={messageId}
    >
      <div className="flex flex-col gap-3">
        {ranges.map((range, index) => {
          const startHourId = `${id}-start-hour-${index}`;
          const startMinuteId = `${id}-start-minute-${index}`;
          const startMeridiemId = `${id}-start-meridiem-${index}`;
          const endHourId = `${id}-end-hour-${index}`;
          const endMinuteId = `${id}-end-minute-${index}`;
          const endMeridiemId = `${id}-end-meridiem-${index}`;

          const buildInputs = (
            label: string,
            baseName: keyof TimeRange,
            current: TimeParts,
            ids: { hour: string; minute: string; meridiem: string }
          ) => (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">{label}</span>
              <div className="flex items-center gap-2">
                <input
                  id={ids.hour}
                  name={`${name}-${baseName}-hour-${index}`}
                  type="number"
                  min={1}
                  max={12}
                  className={`${INPUT_CLASS} w-20 ${error ? INPUT_ERROR_CLASS : ''}`}
                  value={current.hour}
                  onChange={event => updateRange(index, baseName, 'hour', event.target.value)}
                  placeholder="HH"
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={messageId}
                />
                <span className="text-gray-700">:</span>
                <input
                  id={ids.minute}
                  name={`${name}-${baseName}-minute-${index}`}
                  type="number"
                  min={0}
                  max={59}
                  className={`${INPUT_CLASS} w-20 ${error ? INPUT_ERROR_CLASS : ''}`}
                  value={current.minute}
                  onChange={event => updateRange(index, baseName, 'minute', event.target.value)}
                  placeholder="MM"
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={messageId}
                />
                <select
                  id={ids.meridiem}
                  name={`${name}-${baseName}-meridiem-${index}`}
                  className={`${INPUT_CLASS} w-24 ${error ? INPUT_ERROR_CLASS : ''}`}
                  value={current.meridiem}
                  onChange={event =>
                    updateRange(index, baseName, 'meridiem', event.target.value as Meridiem)
                  }
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={messageId}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          );

          return (
            <div key={index} className="flex flex-col gap-2 border border-gray-200 rounded-md p-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {buildInputs('Start', 'start', range.start, {
                  hour: startHourId,
                  minute: startMinuteId,
                  meridiem: startMeridiemId,
                })}
                {buildInputs('End', 'end', range.end, {
                  hour: endHourId,
                  minute: endMinuteId,
                  meridiem: endMeridiemId,
                })}
                <button
                  type="button"
                  className="text-sm text-red-600 hover:underline self-start"
                  onClick={() => removeRange(index)}
                  aria-label={`Remove time range ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        <div>
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={addRange}
          >
            Add Hours
          </button>
        </div>
        <div className="text-xs text-gray-500" aria-hidden>
          Saved as "HH:MM:SS-HH:MM:SS" ranges automatically
        </div>
      </div>
    </FieldWrapper>
  );
}

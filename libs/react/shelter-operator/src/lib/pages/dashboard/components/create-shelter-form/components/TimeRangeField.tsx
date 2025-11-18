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
  required?: boolean;
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

const parseRange = (value: string): TimeRange => {
  const [startRaw = '', endRaw = ''] = (value ?? '').split('-');
  return {
    start: toParts(startRaw.trim()),
    end: toParts(endRaw.trim()),
  };
};

const serializeRange = (range: TimeRange) => {
  const start = to24Hour(range.start);
  const end = to24Hour(range.end);
  if (!start || !end) {
    return '';
  }
  return `${start}-${end}`;
};

export function TimeRangeField({ id, name, label, value, onChange, helperText, error, required }: TimeRangeFieldProps) {
  const range = useMemo(() => parseRange(value), [value]);

  const messageId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined;

  const updateRange = (key: keyof TimeRange, part: keyof TimeParts, rawValue: string) => {
    const updater = part === 'hour' ? normalizeHour : part === 'minute' ? normalizeMinute : undefined;
    const nextValue = updater ? updater(rawValue) : rawValue;

    const nextRange: TimeRange = {
      ...range,
      [key]: {
        ...range[key],
        [part]: nextValue,
      },
    };

    onChange(serializeRange(nextRange));
  };

  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      helperText={helperText}
      error={error}
      messageId={messageId}
      required={required}
    >
      <div className="flex flex-col gap-2 border border-gray-200 rounded-md p-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {(() => {
            const startHourId = `${id}-start-hour`;
            const startMinuteId = `${id}-start-minute`;
            const startMeridiemId = `${id}-start-meridiem`;
            return (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-700">Start</span>
                <div className="flex items-center gap-2">
                  <input
                    id={startHourId}
                    name={`${name}-start-hour`}
                    type="number"
                    min={1}
                    max={12}
                    className={`${INPUT_CLASS} w-20 ${error ? INPUT_ERROR_CLASS : ''}`}
                    value={range.start.hour}
                    onChange={event => updateRange('start', 'hour', event.target.value)}
                    placeholder="HH"
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={messageId}
                  />
                  <span className="text-gray-700">:</span>
                  <input
                    id={startMinuteId}
                    name={`${name}-start-minute`}
                    type="number"
                    min={0}
                    max={59}
                    className={`${INPUT_CLASS} w-20 ${error ? INPUT_ERROR_CLASS : ''}`}
                    value={range.start.minute}
                    onChange={event => updateRange('start', 'minute', event.target.value)}
                    placeholder="MM"
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={messageId}
                  />
                  <select
                    id={startMeridiemId}
                    name={`${name}-start-meridiem`}
                    className={`${INPUT_CLASS} w-24 ${error ? INPUT_ERROR_CLASS : ''}`}
                    value={range.start.meridiem}
                    onChange={event => updateRange('start', 'meridiem', event.target.value as Meridiem)}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={messageId}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            );
          })()}
          {(() => {
            const endHourId = `${id}-end-hour`;
            const endMinuteId = `${id}-end-minute`;
            const endMeridiemId = `${id}-end-meridiem`;
            return (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-700">End</span>
                <div className="flex items-center gap-2">
                  <input
                    id={endHourId}
                    name={`${name}-end-hour`}
                    type="number"
                    min={1}
                    max={12}
                    className={`${INPUT_CLASS} w-20 ${error ? INPUT_ERROR_CLASS : ''}`}
                    value={range.end.hour}
                    onChange={event => updateRange('end', 'hour', event.target.value)}
                    placeholder="HH"
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={messageId}
                  />
                  <span className="text-gray-700">:</span>
                  <input
                    id={endMinuteId}
                    name={`${name}-end-minute`}
                    type="number"
                    min={0}
                    max={59}
                    className={`${INPUT_CLASS} w-20 ${error ? INPUT_ERROR_CLASS : ''}`}
                    value={range.end.minute}
                    onChange={event => updateRange('end', 'minute', event.target.value)}
                    placeholder="MM"
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={messageId}
                  />
                  <select
                    id={endMeridiemId}
                    name={`${name}-end-meridiem`}
                    className={`${INPUT_CLASS} w-24 ${error ? INPUT_ERROR_CLASS : ''}`}
                    value={range.end.meridiem}
                    onChange={event => updateRange('end', 'meridiem', event.target.value as Meridiem)}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={messageId}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="text-xs text-gray-500" aria-hidden>
          Saved as "HH:MM:SS-HH:MM:SS" automatically
        </div>
      </div>
    </FieldWrapper>
  );
}

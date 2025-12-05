import { useEffect, useMemo, useState } from 'react';
import { FieldWrapper } from './FieldWrapper';

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

type Selection = boolean[];

const SLICES = 48; // 24 hours / 30 minute slices
const MINUTES_PER_SLICE = 30;

const pad = (value: number) => String(value).padStart(2, '0');

const minutesTo24h = (minutes: number) => {
  const total = Math.max(0, Math.min(24 * 60, minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${pad(hours)}:${pad(mins)}:00`;
};

const minutesToDisplay = (minutes: number) => {
  const total = minutes % (24 * 60);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelveHour}:${pad(mins)} ${meridiem}`;
};

const parseTimeToMinutes = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const [hourRaw, minuteRaw = '0'] = trimmed.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return hour * 60 + minute;
};

const parseValueToSelection = (value: string): Selection => {
  const selected = Array(SLICES).fill(false) as boolean[];
  if (!value) return selected;

  value.split(',').forEach(rangeStr => {
    const [startRaw, endRaw] = rangeStr.split('-').map(part => part?.trim() ?? '');
    const startMinutes = parseTimeToMinutes(startRaw);
    const endMinutes = parseTimeToMinutes(endRaw);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return;
    }
    const startIdx = Math.max(0, Math.min(SLICES - 1, Math.floor(startMinutes / MINUTES_PER_SLICE)));
    const endIdx = Math.max(0, Math.min(SLICES, Math.ceil(endMinutes / MINUTES_PER_SLICE)));
    for (let i = startIdx; i < endIdx; i += 1) {
      selected[i] = true;
    }
  });

  return selected;
};

const selectionToValue = (selection: Selection) => {
  const ranges: Array<[number, number]> = [];
  let i = 0;
  while (i < selection.length) {
    if (!selection[i]) {
      i += 1;
      continue;
    }
    const start = i;
    while (i < selection.length && selection[i]) {
      i += 1;
    }
    const end = i;
    ranges.push([start * MINUTES_PER_SLICE, end * MINUTES_PER_SLICE]);
  }
  return ranges.map(([start, end]) => `${minutesTo24h(start)}-${minutesTo24h(end)}`).join(',');
};

const selectionToFriendlyText = (selection: Selection) => {
  const ranges: string[] = [];
  let i = 0;
  while (i < selection.length) {
    if (!selection[i]) {
      i += 1;
      continue;
    }
    const start = i;
    while (i < selection.length && selection[i]) {
      i += 1;
    }
    const end = i;
    ranges.push(`${minutesToDisplay(start * MINUTES_PER_SLICE)} – ${minutesToDisplay(end * MINUTES_PER_SLICE)}`);
  }

  return ranges.length ? ranges.join(', ') : 'No hours selected';
};

export function TimeRangeField({ id, label, value, onChange, helperText, error, required }: TimeRangeFieldProps) {
  const [selected, setSelected] = useState<Selection>(() => parseValueToSelection(value));
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);

  useEffect(() => {
    setSelected(parseValueToSelection(value));
  }, [value]);

  const messageId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined;
  const friendlyText = useMemo(() => selectionToFriendlyText(selected), [selected]);

  const updateSelection = (index: number, modeOverride?: 'select' | 'deselect') => {
    const next = [...selected];
    const shouldSelect = modeOverride ?? (selected[index] ? 'deselect' : 'select');
    next[index] = shouldSelect === 'select';
    setSelected(next);
    onChange(selectionToValue(next));
  };

  const handlePointerDown = (index: number) => {
    const mode = selected[index] ? 'deselect' : 'select';
    setDragMode(mode);
    updateSelection(index, mode);
  };

  const handlePointerEnter = (index: number) => {
    if (!dragMode) return;
    updateSelection(index, dragMode);
  };

  const handlePointerUp = () => {
    setDragMode(null);
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FieldWrapper label={label} htmlFor={id} helperText={helperText} error={error} messageId={messageId} required={required}>
      <div className="flex flex-col gap-3 border border-gray-200 rounded-md p-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Click or drag across 30-minute blocks to add ranges.</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative">
            <div
              className="grid gap-[1px] bg-gray-300 rounded-sm overflow-hidden select-none w-full max-w-3xl mx-auto ring-1 ring-gray-300"
              style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}
            >
              {Array.from({ length: SLICES }, (_, index) => {
                const isSelected = selected[index];
                return (
                  <div
                    key={index}
                    role="presentation"
                    onPointerDown={() => handlePointerDown(index)}
                    onPointerEnter={() => handlePointerEnter(index)}
                    className={`h-8 cursor-pointer transition-colors outline outline-[0.5px] outline-gray-300 ${
                      isSelected ? 'bg-green-600' : 'bg-white hover:bg-green-100'
                    }`}
                    data-testid={`${id}-slice-${index}`}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-12 text-[11px] text-gray-500 mt-2 w-full max-w-3xl mx-auto">
              {Array.from({ length: 12 }, (_, hour) => (
                <div key={hour} className="text-center">
                  {hour === 0 ? '12a' : `${hour}a`}
                </div>
              ))}
              {Array.from({ length: 12 }, (_, hour) => (
                <div key={hour + 12} className="text-center">
                  {hour === 0 ? '12p' : `${hour}p`}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-700" aria-live="polite">
          {friendlyText}
        </div>
      </div>
    </FieldWrapper>
  );
}

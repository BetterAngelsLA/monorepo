import type { Meta } from '@storybook/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { DateRangePresetDropdown } from './DateRangePresetDropdown';
import { resolvePresetValue } from './presets';
import type { DateRangePresetValue } from './types';

const meta: Meta<typeof DateRangePresetDropdown> = {
  component: DateRangePresetDropdown,
  title: 'Date Range Filter/PresetDropdown',
};
export default meta;

const fmt = (date: Date | null) => (date ? format(date, 'MM/dd/yyyy') : '—');

/**
 * The widget is controlled and value-agnostic: it reports `CUSTOM` like any
 * other entry, so this story can show the reported value without a calendar.
 */
export const Controlled = () => {
  const [value, setValue] = useState<DateRangePresetValue>('LAST_30_DAYS');
  const range = resolvePresetValue(value);

  return (
    <div className="w-[20rem] space-y-3 p-4">
      <DateRangePresetDropdown
        ariaLabel="Date range"
        includeAll
        value={value}
        onChange={(next) => setValue(next ?? 'ALL')}
      />
      <p className="font-sans text-sm text-neutral-50">
        reported: <b>{value}</b> · {fmt(range.from)} – {fmt(range.to)}
      </p>
    </div>
  );
};

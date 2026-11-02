import type { Meta } from '@storybook/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { DateRangeFilter } from './DateRangeFilter';
import { DateRangePresetDropdown } from './DateRangePresetDropdown';
import { resolvePresetValue } from './presets';
import type { DateRange, DateRangePresetValue } from './types';

const meta: Meta<typeof DateRangePresetDropdown> = {
  component: DateRangePresetDropdown,
  title: 'Date Range Filter/PresetDropdown',
};
export default meta;

const fmt = (date: Date | null) => (date ? format(date, 'MM/dd/yyyy') : '—');

export const Controlled = () => {
  const [preset, setPreset] = useState<DateRangePresetValue>('LAST_30_DAYS');
  const [customRequested, setCustomRequested] = useState(false);
  const range = resolvePresetValue(preset);

  return (
    <div className="w-[20rem] space-y-3 p-4">
      <DateRangePresetDropdown
        label="Date range"
        includeAll
        value={preset}
        onChange={(next) => setPreset(next ?? 'ALL')}
        onCustomSelected={() => setCustomRequested(true)}
      />
      <p className="font-sans text-sm text-neutral-50">
        preset: <b>{preset}</b> · {fmt(range.from)} – {fmt(range.to)}
      </p>
      {customRequested && (
        <p className="font-sans text-sm text-primary-main">
          Custom selected → toolbar would open the calendar.
        </p>
      )}
    </div>
  );
};

export const FullFilter = () => {
  const [state, setState] = useState<{
    preset: DateRangePresetValue;
    range: DateRange;
  }>({ preset: 'LAST_30_DAYS', range: resolvePresetValue('LAST_30_DAYS') });

  return (
    <div className="w-[42rem] space-y-3 p-4">
      <DateRangeFilter
        includeAll
        presetLabel="Date range"
        presetClassName="w-56"
        pickerClassName="w-80"
        value={state.range}
        preset={state.preset}
        onChange={(range, preset) => setState({ range, preset })}
      />
      <p className="font-sans text-sm text-neutral-50">
        preset: <b>{state.preset}</b> · {fmt(state.range.from)} –{' '}
        {fmt(state.range.to)}
      </p>
    </div>
  );
};

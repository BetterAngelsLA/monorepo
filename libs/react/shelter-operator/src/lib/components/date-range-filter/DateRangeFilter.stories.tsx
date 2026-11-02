import type { Meta } from '@storybook/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { DateRangeFilter } from './DateRangeFilter';
import { resolvePresetValue } from './presets';
import type { DateRange, DateRangePresetValue } from './types';

const meta: Meta<typeof DateRangeFilter> = {
  component: DateRangeFilter,
  title: 'Date Range Filter/DateRangeFilter',
};
export default meta;

const fmt = (date: Date | null) => (date ? format(date, 'MM/dd/yyyy') : '—');

function Harness({ includeAll }: { includeAll?: boolean }) {
  const [state, setState] = useState<{
    preset: DateRangePresetValue;
    range: DateRange;
  }>({ preset: 'LAST_30_DAYS', range: resolvePresetValue('LAST_30_DAYS') });

  return (
    <div className="w-[44rem] space-y-3 p-4">
      <DateRangeFilter
        includeAll={includeAll}
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
}

/** The reports toolbar: presets only, no way to clear the range. */
export const Default = () => <Harness />;

/** The activity log: adds the "All time" entry, so toggling clears the range. */
export const WithAllTime = () => <Harness includeAll />;

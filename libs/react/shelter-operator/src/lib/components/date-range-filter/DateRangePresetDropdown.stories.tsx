import type { Meta } from '@storybook/react';
import { format } from 'date-fns';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { dateRangeFilterAtom } from './dateRangeFilterAtom';
import { DateRangePresetDropdown } from './DateRangePresetDropdown';

const meta: Meta<typeof DateRangePresetDropdown> = {
  component: DateRangePresetDropdown,
  title: 'Date Range Filter/PresetDropdown',
};
export default meta;

const fmt = (date: Date | null) => (date ? format(date, 'MM/dd/yyyy') : '—');

export const WiredToAtom = () => {
  const { preset, range } = useAtomValue(dateRangeFilterAtom);
  const [customRequested, setCustomRequested] = useState(false);
  return (
    <div className="w-[20rem] space-y-3 p-4">
      <DateRangePresetDropdown
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

import type { Meta } from '@storybook/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from './types';

const meta: Meta<typeof DateRangePicker> = {
  component: DateRangePicker,
  title: 'Date Range Filter/DateRangePicker',
};
export default meta;

const fmt = (date: Date | null) => (date ? format(date, 'MM/dd/yyyy') : '—');

export const Default = () => {
  const [range, setRange] = useState<DateRange>({
    from: new Date(2026, 5, 10),
    to: new Date(2026, 5, 18),
  });
  return (
    <div className="w-[24rem] space-y-3 p-4">
      <DateRangePicker value={range} onCommit={setRange} />
      <p className="font-sans text-sm text-neutral-50">
        committed: {fmt(range.from)} – {fmt(range.to)}
      </p>
    </div>
  );
};

export const Empty = () => {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  return (
    <div className="w-[24rem] space-y-3 p-4">
      <DateRangePicker value={range} onCommit={setRange} />
      <p className="font-sans text-sm text-neutral-50">
        committed: {fmt(range.from)} – {fmt(range.to)}
      </p>
    </div>
  );
};

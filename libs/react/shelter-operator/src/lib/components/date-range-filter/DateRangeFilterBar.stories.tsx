import type { Meta } from '@storybook/react';
import { format } from 'date-fns';
import { useAtomValue } from 'jotai';
import { dateRangeFilterAtom } from './dateRangeFilterAtom';
import { DateRangeFilterBar } from './DateRangeFilterBar';

const meta: Meta<typeof DateRangeFilterBar> = {
  component: DateRangeFilterBar,
  title: 'Date Range Filter/DateRangeFilterBar',
};
export default meta;

const fmt = (date: Date | null) => (date ? format(date, 'MM/dd/yyyy') : '—');

export const Default = () => {
  const { preset, range } = useAtomValue(dateRangeFilterAtom);
  return (
    <div className="space-y-4 p-6">
      <DateRangeFilterBar />
      <p className="font-sans text-sm text-neutral-50">
        preset: <b>{preset}</b> · {fmt(range.from)} – {fmt(range.to)}
      </p>
    </div>
  );
};

export const WithExport = () => (
  <div className="p-6">
    <DateRangeFilterBar onExportData={() => undefined} />
  </div>
);

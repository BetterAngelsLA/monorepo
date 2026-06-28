import type { Meta } from '@storybook/react';
import { useState } from 'react';
import { YearGrid } from './YearGrid';

const meta: Meta<typeof YearGrid> = {
  component: YearGrid,
  title: 'Date Range Filter/YearGrid',
};
export default meta;

const storyWrapperClass =
  'w-[18rem] rounded-2xl border border-gray-200 bg-white p-4';

export const Default = () => {
  const [year, setYear] = useState(2026);
  return (
    <div className={storyWrapperClass}>
      <YearGrid selectedYear={year} currentYear={2026} onSelect={setYear} />
    </div>
  );
};

export const NoSelection = () => {
  const [year, setYear] = useState<number | undefined>();
  return (
    <div className={storyWrapperClass}>
      <YearGrid selectedYear={year} currentYear={2026} onSelect={setYear} />
    </div>
  );
};

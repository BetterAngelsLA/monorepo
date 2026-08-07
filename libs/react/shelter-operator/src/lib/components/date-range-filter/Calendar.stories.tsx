import type { Meta } from '@storybook/react';
import { addDays } from 'date-fns';
import { useState } from 'react';
import { Calendar, type RdpDateRange } from './Calendar';

const meta: Meta<typeof Calendar> = {
  component: Calendar,
  title: 'Date Range Filter/Calendar',
};
export default meta;

const storyWrapperClass = 'w-fit rounded-2xl border border-gray-200 bg-white p-4';

const ANCHOR = new Date(2026, 5, 1);

export const Default = () => {
  const [month, setMonth] = useState<Date>(ANCHOR);
  const [range, setRange] = useState<RdpDateRange | undefined>({
    from: addDays(ANCHOR, 9),
    to: addDays(ANCHOR, 17),
  });
  return (
    <div className={storyWrapperClass}>
      <Calendar
        selected={range}
        onSelect={setRange}
        month={month}
        onMonthChange={setMonth}
      />
    </div>
  );
};

export const Empty = () => {
  const [month, setMonth] = useState<Date>(ANCHOR);
  const [range, setRange] = useState<RdpDateRange | undefined>();
  return (
    <div className={storyWrapperClass}>
      <Calendar
        selected={range}
        onSelect={setRange}
        month={month}
        onMonthChange={setMonth}
      />
    </div>
  );
};

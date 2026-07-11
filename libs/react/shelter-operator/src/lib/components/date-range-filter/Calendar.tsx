import { mergeCss } from '@monorepo/react/shared';
import { addMonths, format, subMonths } from 'date-fns';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  DayPicker,
  type DateRange as RdpDateRange,
  type MonthCaptionProps,
} from 'react-day-picker';

export type { RdpDateRange };

export interface CalendarProps {
  selected?: RdpDateRange;
  onSelect?: (range: RdpDateRange | undefined) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  onMonthLabelClick?: (month: Date) => void;
  className?: string;
}

const dayCell = 'relative h-9 w-9 p-0 text-center';
const dayButton =
  'h-9 w-9 rounded-full text-sm text-[#383B40] transition-colors hover:bg-[#F2FAFF]';
const navButton =
  'flex h-7 w-7 items-center justify-center rounded-full text-[#747A82] hover:bg-[#F2FAFF] disabled:opacity-40';
const rangeEndpoint =
  'bg-[#DCF1FF] [&>button]:bg-[#008CEE] [&>button]:text-white [&>button]:ring-0 [&>button]:hover:bg-[#0071C0]';

const classNames = {
  months: 'flex gap-8',
  month: 'flex flex-col gap-3',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'h-9 w-9 text-[0.75rem] font-normal text-[#747A82]',
  week: 'mt-1 flex w-full',
  day: dayCell,
  day_button: dayButton,
  today: '[&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-[#008CEE]',
  range_start: `rounded-l-full ${rangeEndpoint}`,
  range_middle:
    'bg-[#DCF1FF] [&>button]:hover:bg-[#0071C0] [&>button]:hover:text-white',
  range_end: `rounded-r-full ${rangeEndpoint}`,
  outside: 'text-[#A8AEB8]',
  disabled: 'text-[#A8AEB8] opacity-40',
  hidden: 'invisible',
};

export function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  onMonthLabelClick,
  className,
}: CalendarProps) {
  const MonthCaption = useCallback(
    function MonthCaption({ calendarMonth }: MonthCaptionProps) {
      const date = calendarMonth.date;
      return (
        <div className="flex h-9 items-center justify-between">
          <button
            type="button"
            onClick={() => onMonthLabelClick?.(date)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-[#383B40] hover:bg-[#F2FAFF]"
          >
            {format(date, 'MMMM yyyy')}
            <ChevronDown className="h-4 w-4 text-[#747A82]" />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => onMonthChange?.(subMonths(date, 1))}
              className={navButton}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => onMonthChange?.(addMonths(date, 1))}
              className={navButton}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    },
    [onMonthLabelClick, onMonthChange]
  );

  const components = useMemo(
    () => ({ MonthCaption, Nav: () => <></> }),
    [MonthCaption]
  );

  return (
    <DayPicker
      mode="range"
      selected={selected}
      onSelect={onSelect}
      month={month}
      onMonthChange={onMonthChange}
      showOutsideDays
      className={mergeCss(['font-sans', className])}
      classNames={classNames}
      components={components}
    />
  );
}

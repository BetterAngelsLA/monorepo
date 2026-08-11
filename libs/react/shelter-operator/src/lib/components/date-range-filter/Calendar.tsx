import { mergeCss } from '@monorepo/react/shared';
import {
  COLOR_HOVER_BG,
  COLOR_PRIMARY,
  COLOR_PRIMARY_HOVER,
  COLOR_RANGE_BG,
  COLOR_TEXT_DISABLED,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
} from './colors';
import { addMonths, format, subMonths } from 'date-fns';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { createContext, useContext } from 'react';
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
const dayButton = `h-9 w-9 rounded-full text-sm text-[${COLOR_TEXT_PRIMARY}] transition-colors hover:bg-[${COLOR_HOVER_BG}]`;
const navButton = `flex h-7 w-7 items-center justify-center rounded-full text-[${COLOR_TEXT_SECONDARY}] hover:bg-[${COLOR_HOVER_BG}] disabled:opacity-40`;
const rangeEndpoint = `bg-[${COLOR_RANGE_BG}] [&>button]:bg-[${COLOR_PRIMARY}] [&>button]:text-white [&>button]:ring-0 [&>button]:hover:bg-[${COLOR_PRIMARY_HOVER}]`;

const classNames = {
  months: 'flex gap-8',
  month: 'flex flex-col gap-3',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: `h-9 w-9 text-[0.75rem] font-normal text-[${COLOR_TEXT_SECONDARY}]`,
  week: 'mt-1 flex w-full',
  day: dayCell,
  day_button: dayButton,
  today: `[&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-[${COLOR_PRIMARY}]`,
  range_start: `rounded-l-full ${rangeEndpoint}`,
  range_middle: `bg-[${COLOR_RANGE_BG}] [&>button]:hover:bg-[${COLOR_PRIMARY_HOVER}] [&>button]:hover:text-white`,
  range_end: `rounded-r-full ${rangeEndpoint}`,
  outside: `text-[${COLOR_TEXT_DISABLED}]`,
  disabled: `text-[${COLOR_TEXT_DISABLED}] opacity-40`,
  hidden: 'invisible',
};

const CalendarContext = createContext<{
  onMonthChange?: (month: Date) => void;
  onMonthLabelClick?: (month: Date) => void;
}>({});

function CustomMonthCaption({ calendarMonth }: MonthCaptionProps) {
  const { onMonthChange, onMonthLabelClick } = useContext(CalendarContext);
  const date = calendarMonth.date;
  return (
    <div className="flex h-9 items-center justify-between">
      <button
        type="button"
        onClick={() => onMonthLabelClick?.(date)}
        className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-[${COLOR_TEXT_PRIMARY}] hover:bg-[${COLOR_HOVER_BG}]`}
      >
        {format(date, 'MMMM yyyy')}
        <ChevronDown className={`h-4 w-4 text-[${COLOR_TEXT_SECONDARY}]`} />
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
}

function EmptyNav() {
  return <></>;
}

const customComponents = {
  MonthCaption: CustomMonthCaption,
  Nav: EmptyNav,
};

export function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  onMonthLabelClick,
  className,
}: CalendarProps) {
  return (
    <CalendarContext.Provider value={{ onMonthChange, onMonthLabelClick }}>
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={onMonthChange}
        showOutsideDays
        className={mergeCss(['font-sans', className])}
        classNames={classNames}
        components={customComponents}
      />
    </CalendarContext.Provider>
  );
}

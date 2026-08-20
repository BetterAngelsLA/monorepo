import { mergeCss } from '@monorepo/react/shared';
import {
  addMonths,
  differenceInCalendarDays,
  format,
  subMonths,
} from 'date-fns';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { createContext, useCallback, useContext } from 'react';
import {
  DayPicker,
  type DateRange as RdpDateRange,
  type MonthCaptionProps,
} from 'react-day-picker';
import {
  DAY_SELECTED_BG,
  DAY_SELECTED_HOVER_BG,
  DAY_TODAY_RING,
  HOVER_BG,
  RANGE_BG,
  TEXT_DISABLED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from './colors';

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
const dayButton = `h-9 w-9 rounded-full text-sm ${TEXT_PRIMARY} transition-colors ${HOVER_BG}`;
const navButton = `flex h-7 w-7 items-center justify-center rounded-full ${TEXT_SECONDARY} ${HOVER_BG} disabled:opacity-40`;
const rangeEndpoint = `${RANGE_BG} ${DAY_SELECTED_BG} [&>button]:text-white [&>button]:ring-0 ${DAY_SELECTED_HOVER_BG}`;

const classNames = {
  months: 'flex gap-8',
  month: 'flex flex-col gap-3',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: `h-9 w-9 text-[0.75rem] font-normal ${TEXT_SECONDARY}`,
  week: 'mt-1 flex w-full',
  day: dayCell,
  day_button: dayButton,
  today: `[&>button]:ring-1 [&>button]:ring-inset ${DAY_TODAY_RING}`,
  range_start: `rounded-l-full ${rangeEndpoint}`,
  range_middle: `${RANGE_BG} ${DAY_SELECTED_HOVER_BG} [&>button]:hover:text-white`,
  range_end: `rounded-r-full ${rangeEndpoint}`,
  outside: TEXT_DISABLED,
  disabled: `${TEXT_DISABLED} opacity-40`,
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
        className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${TEXT_PRIMARY} ${HOVER_BG}`}
      >
        {format(date, 'MMMM yyyy')}
        <ChevronDown className={`h-4 w-4 ${TEXT_SECONDARY}`} />
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

/**
 * react-day-picker moves the end endpoint for any click after the start, so
 * clicking near the start of a completed range collapses it from the wrong
 * side. Move whichever endpoint is closer to the clicked day instead.
 */
function nearestEndpointRange(from: Date, to: Date, date: Date): RdpDateRange {
  if (differenceInCalendarDays(date, from) < 0) return { from: date, to };
  if (differenceInCalendarDays(date, to) > 0) return { from, to: date };

  const distanceToStart = Math.abs(differenceInCalendarDays(date, from));
  const distanceToEnd = Math.abs(differenceInCalendarDays(date, to));
  return distanceToStart < distanceToEnd
    ? { from: date, to }
    : { from, to: date };
}

export function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  onMonthLabelClick,
  className,
}: CalendarProps) {
  const handleSelect = useCallback(
    (next: RdpDateRange | undefined, triggerDate: Date) => {
      if (selected?.from && selected?.to && triggerDate) {
        onSelect?.(nearestEndpointRange(selected.from, selected.to, triggerDate));
        return;
      }
      onSelect?.(next);
    },
    [onSelect, selected]
  );

  return (
    <CalendarContext.Provider value={{ onMonthChange, onMonthLabelClick }}>
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={handleSelect}
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

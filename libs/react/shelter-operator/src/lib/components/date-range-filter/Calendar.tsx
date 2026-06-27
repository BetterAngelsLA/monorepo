import { mergeCss } from '@monorepo/react/shared';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  DayPicker,
  type DateRange as RdpDateRange,
  type ChevronProps,
  type MonthCaptionProps,
} from 'react-day-picker';

export type { RdpDateRange };

export interface CalendarProps {
  /** Currently selected range (controlled). */
  selected?: RdpDateRange;
  /** Fired when the selected range changes. */
  onSelect?: (range: RdpDateRange | undefined) => void;
  /** Displayed left-most month (controlled), e.g. driven by the year grid. */
  month?: Date;
  /** Fired when paged navigation changes the displayed month. */
  onMonthChange?: (month: Date) => void;
  /** Fired when a month/year caption is clicked — used to open the year grid. */
  onMonthLabelClick?: (month: Date) => void;
  /** Months shown side-by-side. Defaults to 2 (per design). */
  numberOfMonths?: number;
  className?: string;
}

// Tailwind class map from react-day-picker's UI parts to our design tokens.
// Endpoints are solid `primary-main` circles, the in-between band is
// `secondary-main`, and today is an outlined ring. We target the inner
// `<button>` of a day cell with `[&>button]` so the band (on the cell) and the
// circle (on the button) compose cleanly.
// Colors are hardcoded hex (not Tailwind tokens like `primary-main`): the lib's
// design tokens live in this lib's standalone tailwind.config.ts, which the
// consuming apps (shelter-web, storybook) never load — so token utilities like
// `bg-primary-main` produce no CSS there. Sibling base-ui components
// (buttons.tsx) use the same hex approach. Values: primary-main #008CEE,
// secondary-main #DCF1FF, secondary-main-light #F2FAFF, secondary-hover #A7DBFF,
// neutral-20 #383B40, neutral-50 #747A82, neutral-70 #A8AEB8.
const dayCell = 'relative h-9 w-9 p-0 text-center';
const dayButton =
  'h-9 w-9 rounded-full text-sm text-[#383B40] transition-colors hover:bg-[#F2FAFF]';
const navButton =
  'flex h-7 w-7 items-center justify-center rounded-full text-[#747A82] hover:bg-[#F2FAFF] disabled:opacity-40';
// Shared endpoint styling for the range_start/range_end cells (only the
// rounded side differs).
const rangeEndpoint =
  'bg-[#DCF1FF] [&>button]:bg-[#008CEE] [&>button]:text-white [&>button]:ring-0';

const classNames = {
  months: 'flex gap-8',
  month: 'flex flex-col gap-3',
  month_caption: 'relative flex h-9 items-center justify-center',
  caption_label: 'text-sm font-medium text-[#383B40]',
  nav: 'absolute inset-x-0 top-0 flex h-9 items-center justify-between',
  button_previous: navButton,
  button_next: navButton,
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'h-9 w-9 text-[0.75rem] font-normal text-[#747A82]',
  week: 'mt-1 flex w-full',
  day: dayCell,
  day_button: dayButton,
  today: '[&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-[#008CEE]',
  range_start: `rounded-l-full ${rangeEndpoint}`,
  range_middle:
    'bg-[#DCF1FF] [&>button]:rounded-none [&>button]:hover:bg-[#A7DBFF]',
  range_end: `rounded-r-full ${rangeEndpoint}`,
  outside: 'text-[#A8AEB8]',
  disabled: 'text-[#A8AEB8] opacity-40',
  hidden: 'invisible',
};

function Chevron({ orientation, className }: ChevronProps) {
  const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
  return <Icon className={mergeCss(['h-4 w-4', className])} />;
}

/**
 * Two-month range calendar grid (presentational, fully controlled). No shared
 * state lives here — the popover in PR4 wires it to the atom.
 */
export function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  onMonthLabelClick,
  numberOfMonths = 2,
  className,
}: CalendarProps) {
  // Clickable month/year caption that opens the year grid (PR4). It captures
  // `onMonthLabelClick`, so it's memoized (keyed on that callback) to keep a
  // stable identity — otherwise react-day-picker remounts the caption on every
  // render. The `components` object is memoized for the same reason.
  const MonthCaption = useCallback(
    function MonthCaption({ calendarMonth }: MonthCaptionProps) {
      const date = calendarMonth.date;
      return (
        <div className={classNames.month_caption}>
          <button
            type="button"
            onClick={() => onMonthLabelClick?.(date)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-[#383B40] hover:bg-[#F2FAFF]"
          >
            {format(date, 'MMMM yyyy')}
          </button>
        </div>
      );
    },
    [onMonthLabelClick]
  );

  const components = useMemo(() => ({ Chevron, MonthCaption }), [MonthCaption]);

  return (
    <DayPicker
      mode="range"
      selected={selected}
      onSelect={onSelect}
      month={month}
      onMonthChange={onMonthChange}
      numberOfMonths={numberOfMonths}
      pagedNavigation
      showOutsideDays
      className={mergeCss(['font-sans', className])}
      classNames={classNames}
      components={components}
    />
  );
}

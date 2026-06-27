import { mergeCss } from '@monorepo/react/shared';

// TODO(date-range-filter): these years are hard-coded to match Figma
// (a fixed 4x4 grid). Replace with a dynamic/relative window — e.g. derived
// from today or the data's earliest year — once design confirms the range.
// See docs/plans/date-range-filter-plan.md (Phase 0 decision #2).
const FIRST_YEAR = 2021;
const LAST_YEAR = 2036;

const YEARS = Array.from(
  { length: LAST_YEAR - FIRST_YEAR + 1 },
  (_, i) => FIRST_YEAR + i
);

export interface YearGridProps {
  /** The year currently selected (filled). */
  selectedYear?: number;
  /** The year to outline as "current" (defaults to today's year). */
  currentYear?: number;
  /** Fired when a year cell is chosen. */
  onSelect: (year: number) => void;
  className?: string;
}

/**
 * 4x4 grid of selectable years. Presentational leaf — the selected year is
 * filled (`primary-main`) and the current year is outlined.
 */
export function YearGrid({
  selectedYear,
  currentYear = new Date().getFullYear(),
  onSelect,
  className,
}: YearGridProps) {
  return (
    <div
      role="grid"
      className={mergeCss(['grid grid-cols-4 gap-2 font-sans', className])}
    >
      {YEARS.map((year) => {
        const isSelected = year === selectedYear;
        const isCurrent = year === currentYear;
        return (
          <button
            key={year}
            type="button"
            role="gridcell"
            aria-selected={isSelected}
            onClick={() => onSelect(year)}
            className={mergeCss([
              'h-10 rounded-full text-sm transition-colors',
              isSelected
                ? 'bg-[#008CEE] text-white hover:bg-[#0374c4]'
                : 'text-[#383B40] hover:bg-[#F2FAFF]',
              // outline the current year, unless it is also the filled selection
              isCurrent && !isSelected && 'ring-1 ring-inset ring-[#008CEE]',
            ])}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}

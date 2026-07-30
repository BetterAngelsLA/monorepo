import { mergeCss } from '@monorepo/react/shared';

const FIRST_YEAR = 2021;
const LAST_YEAR = 2036;

const YEARS = Array.from(
  { length: LAST_YEAR - FIRST_YEAR + 1 },
  (_, i) => FIRST_YEAR + i
);

export interface YearGridProps {
  selectedYear?: number;
  currentYear?: number;
  onSelect: (year: number) => void;
  className?: string;
}

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
                ? 'bg-[#008CEE] text-white hover:bg-[#0071C0]'
                : 'text-[#383B40] hover:bg-[#F4F6FD]',
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

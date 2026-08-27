import { mergeCss } from '@monorepo/react/shared';
import {
  ACCENT_BG,
  ACCENT_HOVER_BG,
  ACCENT_RING,
  HOVER_BG,
  TEXT_PRIMARY,
} from './colors';

// The window is anchored on the current year rather than fixed, so the grid
// does not run out of future years as time passes. Sixteen years fills the
// four-column layout exactly.
const YEARS_BEFORE = 5;
const YEARS_AFTER = 10;

function yearsAround(anchor: number): number[] {
  return Array.from(
    { length: YEARS_BEFORE + YEARS_AFTER + 1 },
    (_, i) => anchor - YEARS_BEFORE + i,
  );
}

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
      role="group"
      aria-label="Select year"
      className={mergeCss(['grid grid-cols-4 gap-2 font-sans', className])}
    >
      {yearsAround(currentYear).map((year) => {
        const isSelected = year === selectedYear;
        const isCurrent = year === currentYear;
        return (
          <button
            key={year}
            type="button"
            aria-pressed={isSelected}
            aria-current={isCurrent ? 'date' : undefined}
            onClick={() => onSelect(year)}
            className={mergeCss([
              'h-10 rounded-full text-sm transition-colors',
              isSelected
                ? `${ACCENT_BG} text-white ${ACCENT_HOVER_BG}`
                : `${TEXT_PRIMARY} ${HOVER_BG}`,
              isCurrent && !isSelected && `ring-1 ring-inset ${ACCENT_RING}`,
            ])}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}

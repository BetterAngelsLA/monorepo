import { mergeCss } from '@monorepo/react/shared';
import { useState } from 'react';
import {
  ACCENT_BG,
  ACCENT_HOVER_BG,
  ACCENT_RING,
  HOVER_BG,
  TEXT_PRIMARY,
} from './colors';

// The window is anchored on the month the calendar is showing (falling back to
// the current year) rather than a fixed range, so paging to a distant month
// still finds its year in the grid. Sixteen years fills the four-column layout
// exactly.
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
  /**
   * Year the sixteen-year window is centred on. Defaults to `currentYear`, then
   * to this year.
   */
  anchorYear?: number;
  /**
   * Year that gets the "current year" affordance. Defaults to this year and is
   * independent of `anchorYear`, so the marker stays truthful when the window
   * is anchored elsewhere.
   */
  currentYear?: number;
  onSelect: (year: number) => void;
  className?: string;
}

export function YearGrid({
  selectedYear,
  anchorYear,
  currentYear,
  onSelect,
  className,
}: YearGridProps) {
  // @eslint-react/purity: reading the clock during render is impure.
  const [thisYear] = useState(() => new Date().getFullYear());
  const markedYear = currentYear ?? thisYear;
  const windowAnchor = anchorYear ?? markedYear;

  return (
    <div
      role="group"
      aria-label="Select year"
      className={mergeCss(['grid grid-cols-4 gap-2 font-sans', className])}
    >
      {yearsAround(windowAnchor).map((year) => {
        const isSelected = year === selectedYear;
        const isCurrent = year === markedYear;
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

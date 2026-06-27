import { startOfMonth, startOfYear, subDays } from 'date-fns';
import type { DateRange, DateRangePreset } from './types';

/** Human-readable labels for each preset (drives the dropdown options). */
export const PRESET_LABELS: Record<DateRangePreset, string> = {
  LAST_7_DAYS: 'Last 7 Days',
  LAST_30_DAYS: 'Last 30 Days',
  // Figma's label read "Month-To-Year"; treated as a typo. "Month-To-Date"
  // pairs naturally with "Year-To-Date". See the plan's Phase 0 decisions.
  MONTH_TO_DATE: 'Month-To-Date',
  YEAR_TO_DATE: 'Year-To-Date',
  CUSTOM: 'Custom',
};

/**
 * Presets in dropdown display order. `CUSTOM` is last because it opens the
 * calendar rather than resolving to a fixed range.
 */
export const PRESET_ORDER: readonly DateRangePreset[] = [
  'LAST_7_DAYS',
  'LAST_30_DAYS',
  'MONTH_TO_DATE',
  'YEAR_TO_DATE',
  'CUSTOM',
] as const;

/** The preset selected by default on load. */
export const DEFAULT_PRESET: DateRangePreset = 'LAST_30_DAYS';

/**
 * Resolve a preset to a concrete date range. The single source of truth for
 * preset → range; both the dropdown and the calendar derive ranges from here.
 *
 * "Last N Days" is an inclusive window ending today, so it spans exactly N
 * calendar days (today plus the N-1 days before it).
 *
 * `CUSTOM` has no fixed range — it resolves to an empty range and the caller
 * supplies the hand-picked dates.
 */
export function resolvePreset(
  preset: DateRangePreset,
  today: Date = new Date()
): DateRange {
  switch (preset) {
    case 'LAST_7_DAYS':
      return { from: subDays(today, 6), to: today };
    case 'LAST_30_DAYS':
      return { from: subDays(today, 29), to: today };
    case 'MONTH_TO_DATE':
      return { from: startOfMonth(today), to: today };
    case 'YEAR_TO_DATE':
      return { from: startOfYear(today), to: today };
    case 'CUSTOM':
      return { from: null, to: null };
  }
}

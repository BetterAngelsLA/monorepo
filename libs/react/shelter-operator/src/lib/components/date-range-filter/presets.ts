import { startOfMonth, startOfYear, subDays } from 'date-fns';
import type { DateRange, DateRangePreset, DateRangePresetValue } from './types';

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  LAST_7_DAYS: 'Last 7 Days',
  LAST_30_DAYS: 'Last 30 Days',
  MONTH_TO_DATE: 'Month-To-Date',
  YEAR_TO_DATE: 'Year-To-Date',
  CUSTOM: 'Custom',
};

/** The explicit "no range" entry, offered only by filters that can be unfiltered. */
export const ALL_TIME_LABEL = 'All Time';

/**
 * Labels for every selectable value: the reports order, with the extra "no
 * range" entry last so the numbered presets keep their familiar neighbours.
 */
export const PRESET_VALUE_LABELS: Record<DateRangePresetValue, string> = {
  ...PRESET_LABELS,
  ALL: ALL_TIME_LABEL,
};

export const DEFAULT_PRESET: DateRangePreset = 'LAST_30_DAYS';

export function resolvePreset(
  preset: DateRangePreset,
  today: Date = new Date(),
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

/**
 * The concrete range a selectable value stands for. `ALL` is unbounded, which
 * is what makes "no filter" representable without a separate flag.
 */
export function resolvePresetValue(
  value: DateRangePresetValue,
  today?: Date,
): DateRange {
  if (value === 'ALL') {
    return { from: null, to: null };
  }

  return resolvePreset(value, today);
}

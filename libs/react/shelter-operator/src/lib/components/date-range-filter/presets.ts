import { startOfMonth, startOfYear, subDays } from 'date-fns';
import type { DateRange, DateRangePreset } from './types';

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  LAST_7_DAYS: 'Last 7 Days',
  LAST_30_DAYS: 'Last 30 Days',
  MONTH_TO_DATE: 'Month-To-Date',
  YEAR_TO_DATE: 'Year-To-Date',
  CUSTOM: 'Custom',
};

export const DEFAULT_PRESET: DateRangePreset = 'LAST_30_DAYS';

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

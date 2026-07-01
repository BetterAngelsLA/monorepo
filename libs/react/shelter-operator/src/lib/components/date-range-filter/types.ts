/**
 * A committed date range. `from`/`to` are `null` until a range has been chosen
 * (e.g. while the user is mid-selection in the calendar, or for the `CUSTOM`
 * preset before Save).
 */
export type DateRange = {
  from: Date | null;
  to: Date | null;
};

/**
 * The named presets offered in the filter dropdown, plus `CUSTOM` for a range
 * picked by hand in the calendar. Manually committing dates always resolves to
 * `CUSTOM` — a hand-picked span is never snapped back to a named preset.
 */
export type DateRangePreset =
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'MONTH_TO_DATE'
  | 'YEAR_TO_DATE'
  | 'CUSTOM';

/** The shared filter state: the active preset and its resolved range. */
export type DateRangeFilterState = {
  preset: DateRangePreset;
  range: DateRange;
};

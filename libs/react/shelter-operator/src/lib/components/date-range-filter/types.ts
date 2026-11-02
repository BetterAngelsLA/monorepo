export type DateRange = {
  from: Date | null;
  to: Date | null;
};

export type DateRangePreset =
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'MONTH_TO_DATE'
  | 'YEAR_TO_DATE'
  | 'CUSTOM';

/**
 * A selectable preset value: the shared presets plus `ALL`, the explicit "no
 * range" entry a filter can offer when it can be unfiltered (the reports
 * toolbar does not; the activity log does).
 */
export type DateRangePresetValue = DateRangePreset | 'ALL';

export type DateRangeFilterState = {
  preset: DateRangePreset;
  range: DateRange;
};

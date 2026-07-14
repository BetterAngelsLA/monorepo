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

export type DateRangeFilterState = {
  preset: DateRangePreset;
  range: DateRange;
};

import type {
  ConditionChoices,
  DayOfWeekChoices,
} from '@monorepo/react/shelter';

export type TimeRange = {
  /** Local key for React list rendering. */
  _id: string;
  /** The saved row this range came from; absent on a range the user just added. */
  serverId?: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
};

/** Per-day form state. Empty ranges = no hours configured (closed). */
export type DaySchedule = {
  ranges: TimeRange[];
};

export type WeeklyFormState = Record<DayOfWeekChoices, DaySchedule>;

export type ExceptionEntry = {
  /** Local-only key for React list rendering */
  localId: string;
  /** The saved row this entry came from; absent on an entry the user just added. */
  serverId?: string;
  startDate: string; // "YYYY-MM-DD"
  /**
   * Whether the form shows a separate end date. Stored explicitly instead of
   * derived from startDate/endDate so that picking a date never toggles the
   * field, and a range whose ends fall on the same day stays a range.
   */
  isDateRange: boolean;
  endDate: string; // "YYYY-MM-DD" — same as startDate for a single day
  closedAllDay: boolean;
  startTime: string; // "HH:MM" — ignored when closedAllDay
  endTime: string; // "HH:MM" — ignored when closedAllDay
  condition?: ConditionChoices;
};

export type TimeRangeError = {
  startTime?: { message?: string };
  endTime?: { message?: string };
};

export type DayErrors = {
  ranges?: TimeRangeError[];
};

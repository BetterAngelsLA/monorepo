import type {
  ConditionChoices,
  DayOfWeekChoices,
} from '@monorepo/react/shelter';

export type TimeRange = {
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
  startDate: string; // "YYYY-MM-DD"
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

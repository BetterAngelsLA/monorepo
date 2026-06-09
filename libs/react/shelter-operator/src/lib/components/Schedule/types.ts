import type {
  ConditionChoices,
  DayOfWeekChoices,
} from '@monorepo/react/shelter';

// ─── Weekly editor ───────────────────────────────────────────────────────────

export type HoursMode = 'same' | 'mixed' | 'closed';

export type TimeRange = {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
};

export type DayState = {
  open: boolean;
  startTime: string;
  endTime: string;
};

export type WeeklyFormState = {
  mode: HoursMode;
  sameHours: TimeRange;
  dayHours: Record<DayOfWeekChoices, DayState>;
};

// ─── Exceptions ───────────────────────────────────────────────────────────────

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

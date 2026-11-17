import {
  parseTimeString,
  toDateString,
  toTimeString,
} from '@monorepo/shared/scalars';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import {
  DayOfWeekChoices,
  ScheduleTypeChoices,
  ShelterType,
} from '../../../apollo';

type Schedule = ShelterType['schedules'][number];

const CLOSING_SOON_MINUTES = 60;
const MINUTES_PER_DAY = 24 * 60;

/**
 * A time window in minutes since the day the window starts. A window that
 * crosses midnight keeps a `close` past 1440 until it is clipped to a date.
 */
interface TimeWindow {
  open: number;
  close: number;
}

interface ConcreteWindow {
  start: Date;
  end: Date;
}

const JS_DAY_TO_ENUM: Record<number, DayOfWeekChoices> = {
  0: DayOfWeekChoices.Sunday,
  1: DayOfWeekChoices.Monday,
  2: DayOfWeekChoices.Tuesday,
  3: DayOfWeekChoices.Wednesday,
  4: DayOfWeekChoices.Thursday,
  5: DayOfWeekChoices.Friday,
  6: DayOfWeekChoices.Saturday,
};

/**
 * `undefined` for a time we cannot read — a window we cannot place is not a
 * window that opens at midnight.
 */
function normalizeWindow(
  startTime?: string | null,
  endTime?: string | null,
): TimeWindow | undefined {
  const open = parseTimeString(startTime);
  let close = parseTimeString(endTime);

  if (open === undefined || close === undefined) {
    return undefined;
  }

  // Overnight shifts stay attached to the start day.
  if (close <= open) {
    close += MINUTES_PER_DAY;
  }

  return { open, close };
}

/** Check if a date string falls within an optional [start, end] range */
function dateInRange(
  dateStr: string,
  start?: string | null,
  end?: string | null,
): boolean {
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

/** Subtract exception windows from base windows */
function subtractWindows(
  bases: TimeWindow[],
  exceptions: TimeWindow[],
): TimeWindow[] {
  let current = [...bases];
  for (const exc of exceptions) {
    const next: TimeWindow[] = [];
    for (const base of current) {
      if (exc.close <= base.open || exc.open >= base.close) {
        next.push(base);
        continue;
      }
      if (exc.open > base.open) {
        next.push({ open: base.open, close: exc.open });
      }
      if (exc.close < base.close) {
        next.push({ open: exc.close, close: base.close });
      }
    }
    current = next;
  }
  return current;
}

export interface EffectiveWindow {
  startTime: string;
  endTime: string;
}

export interface WeeklyScheduleDay {
  date: Date;
  day: DayOfWeekChoices;
  label: string;
  isToday: boolean;
  windows: EffectiveWindow[];
}

export interface OperatingStatus {
  tone: 'open' | 'closed';
  statusText: 'Open now' | 'Closing soon' | 'Closed';
  detailText: string;
}

export interface AggregateStatus {
  tone: 'open' | 'closed' | 'partial';
  statusText: 'Open Now' | 'Closing Soon' | 'Closed' | 'Partially Open';
}

export function getAggregateStatus(
  schedules: Schedule[],
  scheduleTypes: ScheduleTypeChoices[],
  now: Date = new Date(),
): AggregateStatus {
  if (scheduleTypes.length === 0) {
    return { tone: 'closed', statusText: 'Closed' };
  }

  const statuses = scheduleTypes.map((type) => {
    const typed = schedules.filter((s) => s.scheduleType === type);
    return getOperatingStatus(typed, now, type);
  });

  const anyOpen = statuses.some((s) => s.tone === 'open');
  const anyClosed = statuses.some((s) => s.tone === 'closed');

  if (anyOpen && !anyClosed) {
    return { tone: 'open', statusText: 'Open Now' };
  }
  if (anyClosed && !anyOpen) {
    // "Closing soon" carries a closed tone, but the shelter is still open. When
    // that is the only reason nothing reads as open, the header has to say so
    // instead of contradicting the hours dialog.
    const closingSoon = statuses.every(
      (status) => status.statusText === 'Closing soon',
    );

    return {
      tone: 'closed',
      statusText: closingSoon ? 'Closing Soon' : 'Closed',
    };
  }
  return { tone: 'partial', statusText: 'Partially Open' };
}

/**
 * The rows that apply to one calendar date, with their times relative to that
 * date's midnight. An overnight window keeps a `close` past 1440 here; it is
 * only clipped once it has been merged with the neighbouring date's rows.
 */
type DayEntries = {
  baseWindows: TimeWindow[];
  exceptionWindows: TimeWindow[];
  /** A closure with no times covers the entire date. */
  closedAllDay: boolean;
};

function getDayEntries(
  schedules: Schedule[],
  date: Date,
  scheduleType: ScheduleTypeChoices,
): DayEntries {
  const dateStr = toDateString(date);
  const dayEnum = JS_DAY_TO_ENUM[date.getDay()];

  const typed = schedules.filter((s) => s.scheduleType === scheduleType);
  const applies = (s: Schedule) =>
    (s.day === dayEnum || !s.day) &&
    dateInRange(dateStr, s.startDate, s.endDate);

  const baseEntries = typed.filter(
    (s) => !s.isException && s.startTime && s.endTime && applies(s),
  );
  const exceptionEntries = typed.filter((s) => s.isException && applies(s));

  return {
    baseWindows: baseEntries.flatMap(
      (s) => normalizeWindow(s.startTime, s.endTime) ?? [],
    ),
    exceptionWindows: exceptionEntries.flatMap(
      (e) => normalizeWindow(e.startTime, e.endTime) ?? [],
    ),
    closedAllDay: exceptionEntries.some((e) => !e.startTime || !e.endTime),
  };
}

/**
 * Effective windows for one calendar date, in minutes since that date's
 * midnight.
 *
 * A window belongs to the day it **starts**: 8 PM Monday – 8 AM Tuesday is
 * Monday 8 PM–midnight on Monday's row and midnight–8 AM on Tuesday's row. So
 * each date is evaluated on a two-day axis (yesterday 00:00 = 0, today 00:00 =
 * 1440): yesterday's window contributes its after-midnight tail, today's own
 * windows are shifted a day forward, exceptions are subtracted on the same
 * axis, then the result is clipped back to today.
 *
 * Subtracting before clipping is what keeps exceptions honest: closing 8 PM–8
 * AM on Monday must also clear Tuesday's early-morning tail, whichever date the
 * exception was entered for.
 */
function getEffectiveTimeWindows(
  schedules: Schedule[],
  date: Date,
  scheduleType: ScheduleTypeChoices,
): TimeWindow[] {
  const today = getDayEntries(schedules, date, scheduleType);

  if (today.closedAllDay) {
    return [];
  }

  const yesterday = getDayEntries(schedules, addDays(date, -1), scheduleType);

  const shift = (windows: TimeWindow[], by: number) =>
    windows.map((w) => ({ open: w.open + by, close: w.close + by }));

  const baseWindows = [
    ...shift(yesterday.baseWindows, 0),
    ...shift(today.baseWindows, MINUTES_PER_DAY),
  ];
  const exceptionWindows = [
    ...shift(yesterday.exceptionWindows, 0),
    ...shift(today.exceptionWindows, MINUTES_PER_DAY),
  ];

  return subtractWindows(baseWindows, exceptionWindows)
    .map((w) => ({
      open: Math.max(w.open, MINUTES_PER_DAY),
      close: Math.min(w.close, 2 * MINUTES_PER_DAY),
    }))
    .filter((w) => w.close > w.open)
    .map((w) => ({
      open: w.open - MINUTES_PER_DAY,
      close: w.close - MINUTES_PER_DAY,
    }))
    .sort((a, b) => a.open - b.open);
}

function getConcreteWindows(
  schedules: Schedule[],
  date: Date,
  scheduleType: ScheduleTypeChoices,
): ConcreteWindow[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  return getEffectiveTimeWindows(schedules, date, scheduleType).map(
    (window) => ({
      start: new Date(dayStart.getTime() + window.open * 60_000),
      end: new Date(dayStart.getTime() + window.close * 60_000),
    }),
  );
}

export const CLOCK_PATTERN = 'h:mm a';

function formatClock(date: Date): string {
  return format(date, CLOCK_PATTERN);
}

/**
 * Compute effective open windows for a given date and schedule type
 * by subtracting active exceptions from base schedule entries.
 */
export function getEffectiveWindows(
  schedules: Schedule[],
  date: Date,
  scheduleType: ScheduleTypeChoices,
): EffectiveWindow[] {
  return getEffectiveTimeWindows(schedules, date, scheduleType).map((w) => ({
    // `toTimeString` clamps 1440 to 23:59, which is how a window that runs to
    // midnight is displayed (the scalar cannot carry 24:00).
    startTime: toTimeString(w.open),
    endTime: toTimeString(w.close),
  }));
}

function getWeekDaysMondayFirst(today?: Date): Date[] {
  const reference = today ?? new Date();
  const monday = startOfWeek(reference, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function getWeeklySchedule(
  schedules: Schedule[],
  scheduleType: ScheduleTypeChoices,
  today?: Date,
): WeeklyScheduleDay[] {
  const reference = today ?? new Date();

  return getWeekDaysMondayFirst(reference).map((date) => ({
    date,
    day: JS_DAY_TO_ENUM[date.getDay()],
    label: format(date, 'EEEE'),
    isToday: isSameDay(date, reference),
    windows: getEffectiveWindows(schedules, date, scheduleType),
  }));
}

/**
 * End of the continuous open run that *index* belongs to.
 *
 * A shift that crosses midnight — or is cut in two by an exception — arrives
 * here as touching windows. "Closing soon" has to measure where the shelter
 * actually shuts, not where the current day's segment happens to end, or an
 * overnight shelter reads as closing at midnight.
 */
function getOpenRunEnd(windows: ConcreteWindow[], index: number): Date {
  let end = windows[index].end;

  for (const window of windows.slice(index + 1)) {
    if (window.start.getTime() > end.getTime()) {
      break;
    }

    if (window.end.getTime() > end.getTime()) {
      end = window.end;
    }
  }

  return end;
}

export function getOperatingStatus(
  schedules: Schedule[],
  now: Date = new Date(),
  scheduleType: ScheduleTypeChoices = ScheduleTypeChoices.Operating,
): OperatingStatus {
  const concreteWindows = Array.from({ length: 9 }, (_, index) => index - 1)
    .flatMap((offset) =>
      getConcreteWindows(schedules, addDays(now, offset), scheduleType),
    )
    .sort((left, right) => left.start.getTime() - right.start.getTime());

  const currentIndex = concreteWindows.findIndex(
    (window) => now >= window.start && now < window.end,
  );

  if (currentIndex !== -1) {
    const closesAt = getOpenRunEnd(concreteWindows, currentIndex);
    const remainingMinutes = Math.floor(
      (closesAt.getTime() - now.getTime()) / 60_000,
    );

    if (remainingMinutes <= CLOSING_SOON_MINUTES) {
      return {
        tone: 'closed',
        statusText: 'Closing soon',
        detailText: formatClock(closesAt),
      };
    }

    return {
      tone: 'open',
      statusText: 'Open now',
      // A run that never ends within a day (a 24 h schedule) has no close time
      // worth printing.
      detailText:
        remainingMinutes >= MINUTES_PER_DAY
          ? ''
          : `Closes ${formatClock(closesAt)}`,
    };
  }

  const nextWindow = concreteWindows.find((window) => window.start > now);
  if (!nextWindow) {
    return {
      tone: 'closed',
      statusText: 'Closed',
      detailText: '',
    };
  }

  return {
    tone: 'closed',
    statusText: 'Closed',
    detailText: isSameDay(nextWindow.start, now)
      ? `Opens ${formatClock(nextWindow.start)}`
      : `Opens ${format(nextWindow.start, 'EEEE')} ${formatClock(
          nextWindow.start,
        )}`,
  };
}

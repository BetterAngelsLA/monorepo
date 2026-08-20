import {
  fromTimeString,
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

/** A time window in minutes since midnight */
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

/** Wrap into a single day — overnight windows carry a +1440 offset. */
function wrapIntoDay(minutes: number): number {
  return ((minutes % 1440) + 1440) % 1440;
}

/**
 * `undefined` for a time we cannot read — a window we cannot place is not a
 * window that opens at midnight.
 */
function normalizeWindow(
  startTime?: string | null,
  endTime?: string | null,
): TimeWindow | undefined {
  const open = fromTimeString(startTime);
  let close = fromTimeString(endTime);

  if (open === undefined || close === undefined) {
    return undefined;
  }

  // Overnight shifts stay attached to the start day.
  if (close <= open) {
    close += 1440;
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
  statusText: 'Open Now' | 'Closed' | 'Partially Open';
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
    return { tone: 'closed', statusText: 'Closed' };
  }
  return { tone: 'partial', statusText: 'Partially Open' };
}

function getEffectiveTimeWindows(
  schedules: Schedule[],
  date: Date,
  scheduleType: ScheduleTypeChoices,
): TimeWindow[] {
  const dateStr = toDateString(date);
  const dayEnum = JS_DAY_TO_ENUM[date.getDay()];

  const typed = schedules.filter((s) => s.scheduleType === scheduleType);

  const baseEntries = typed.filter(
    (s) =>
      !s.isException &&
      (s.day === dayEnum || !s.day) &&
      s.startTime &&
      s.endTime &&
      dateInRange(dateStr, s.startDate, s.endDate),
  );

  const baseWindows = baseEntries.flatMap(
    (s) => normalizeWindow(s.startTime, s.endTime) ?? [],
  );

  const activeExceptions = typed.filter(
    (s) =>
      s.isException &&
      (s.day === dayEnum || !s.day) &&
      dateInRange(dateStr, s.startDate, s.endDate),
  );

  if (activeExceptions.some((e) => !e.startTime || !e.endTime)) {
    return [];
  }

  const excWindows = activeExceptions.flatMap(
    (e) => normalizeWindow(e.startTime, e.endTime) ?? [],
  );

  const effective = subtractWindows(baseWindows, excWindows);
  effective.sort((a, b) => a.open - b.open);
  return effective;
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

function formatClock(date: Date): string {
  return format(date, 'h:mm a');
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
    startTime: toTimeString(wrapIntoDay(w.open)),
    endTime: toTimeString(wrapIntoDay(w.close)),
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

  const currentWindow = concreteWindows.find(
    (window) => now >= window.start && now < window.end,
  );

  if (currentWindow) {
    const remainingMinutes = Math.floor(
      (currentWindow.end.getTime() - now.getTime()) / 60_000,
    );

    if (remainingMinutes <= CLOSING_SOON_MINUTES) {
      return {
        tone: 'closed',
        statusText: 'Closing soon',
        detailText: formatClock(currentWindow.end),
      };
    }

    return {
      tone: 'open',
      statusText: 'Open now',
      detailText: `Closes ${formatClock(currentWindow.end)}`,
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

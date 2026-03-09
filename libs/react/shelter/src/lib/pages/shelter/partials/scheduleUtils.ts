import {
  DayOfWeekChoices,
  ScheduleTypeChoices,
  ShelterType,
} from '../../../apollo';

type Schedule = ShelterType['schedules'][number];

/** A time window in minutes since midnight */
interface TimeWindow {
  open: number;
  close: number;
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

/** Parse "HH:mm:ss" to minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Format minutes since midnight to "HH:mm:ss" */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Format a Date as "YYYY-MM-DD" */
function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Check if a date string falls within an optional [start, end] range */
function dateInRange(
  dateStr: string,
  start?: string | null,
  end?: string | null
): boolean {
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

/** Subtract exception windows from base windows */
function subtractWindows(
  bases: TimeWindow[],
  exceptions: TimeWindow[]
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
  openTime: string;
  closeTime: string;
}

/**
 * Compute effective open windows for a given date and schedule type
 * by subtracting active exceptions from base schedule entries.
 */
export function getEffectiveWindows(
  schedules: Schedule[],
  date: Date,
  scheduleType: ScheduleTypeChoices
): EffectiveWindow[] {
  const dateStr = formatDateISO(date);
  const dayEnum = JS_DAY_TO_ENUM[date.getDay()];

  const typed = schedules.filter((s) => s.scheduleType === scheduleType);

  // Base windows: non-exception entries matching this weekday (or day=null),
  // within their optional date bounds, that have open/close times
  const baseEntries = typed.filter(
    (s) =>
      !s.isException &&
      (s.day === dayEnum || !s.day) &&
      s.openTime &&
      s.closeTime &&
      dateInRange(dateStr, s.startDate, s.endDate)
  );

  const baseWindows: TimeWindow[] = baseEntries.map((s) => ({
    open: timeToMinutes(s.openTime ?? '00:00:00'),
    close: timeToMinutes(s.closeTime ?? '00:00:00'),
  }));

  // Active exceptions whose date range covers this date
  const activeExceptions = typed.filter(
    (s) => s.isException && dateInRange(dateStr, s.startDate, s.endDate)
  );

  // If any exception is "closed all day" (no times), return empty
  if (activeExceptions.some((e) => !e.openTime || !e.closeTime)) {
    return [];
  }

  const excWindows: TimeWindow[] = activeExceptions.map((e) => ({
    open: timeToMinutes(e.openTime ?? '00:00:00'),
    close: timeToMinutes(e.closeTime ?? '00:00:00'),
  }));

  const effective = subtractWindows(baseWindows, excWindows);
  effective.sort((a, b) => a.open - b.open);

  return effective.map((w) => ({
    openTime: minutesToTime(w.open),
    closeTime: minutesToTime(w.close),
  }));
}

/** Get the next 7 days starting from today */
export function getNext7Days(today?: Date): Date[] {
  const start = today ?? new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

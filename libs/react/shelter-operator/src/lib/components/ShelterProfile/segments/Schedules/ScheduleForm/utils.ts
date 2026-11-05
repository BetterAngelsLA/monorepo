import {
  type ScheduleInput,
  type ScheduleType,
  ScheduleTypeChoices,
} from '@monorepo/react/shelter';
import { ORDERED_DAYS } from './constants';
import type { ExceptionEntry, WeeklyFormState } from './types';
import { buildDefaultWeeklyState } from './WeeklyScheduleEditor';

export function toHHMM(time: string | null | undefined): string {
  if (!time) {
    return '';
  }

  return String(time).slice(0, 5);
}

export function hydrateWeekly(schedules: ScheduleType[]): WeeklyFormState {
  const state = buildDefaultWeeklyState();

  for (const entry of schedules) {
    if (!entry.day) {
      continue;
    }

    state[entry.day].ranges.push({
      _id: entry.id ?? `${entry.day}-${state[entry.day].ranges.length}`,
      serverId: entry.id ?? undefined,
      startTime: toHHMM(entry.startTime),
      endTime: toHHMM(entry.endTime),
    });
  }

  return state;
}

export function hydrateExceptions(schedules: ScheduleType[]): ExceptionEntry[] {
  return schedules.map((s) => ({
    localId: s.id ?? crypto.randomUUID(),
    serverId: s.id ?? undefined,
    startDate: s.startDate ?? '',
    // A saved range is only recognizable when its ends differ; a same-day
    // exception loads as a single day.
    isDateRange: Boolean(s.startDate && s.endDate && s.endDate !== s.startDate),
    endDate: s.endDate ?? s.startDate ?? '',
    closedAllDay: !s.startTime && !s.endTime,
    startTime: toHHMM(s.startTime),
    endTime: toHHMM(s.endTime),
    condition: s.condition ?? undefined,
  }));
}

function toHHMMSS(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

export function buildScheduleInputs(
  scheduleType: ScheduleTypeChoices,
  weekly: WeeklyFormState,
  exceptions: ExceptionEntry[],
): ScheduleInput[] {
  const inputs: ScheduleInput[] = [];

  for (const { value: day } of ORDERED_DAYS) {
    const { ranges } = weekly[day];

    for (const { serverId, startTime, endTime } of ranges) {
      if (!startTime || !endTime) {
        continue;
      }

      inputs.push({
        id: serverId,
        scheduleType,
        days: [day],
        startTime: toHHMMSS(startTime),
        endTime: toHHMMSS(endTime),
        isException: false,
      });
    }
  }

  for (const ex of exceptions) {
    if (!ex.startDate) {
      continue;
    }

    inputs.push({
      id: ex.serverId,
      scheduleType,
      startDate: ex.startDate,
      endDate: ex.endDate || ex.startDate,
      startTime: ex.closedAllDay
        ? undefined
        : toHHMMSS(ex.startTime) || undefined,
      endTime: ex.closedAllDay ? undefined : toHHMMSS(ex.endTime) || undefined,
      condition: ex.condition,
      isException: true,
    });
  }

  return inputs;
}

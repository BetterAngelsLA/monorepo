import {
  ScheduleTypeChoices,
  type ScheduleInput,
  type ScheduleType,
} from '@monorepo/react/shelter';
import { useState } from 'react';
import {
  ScheduleExceptionsForm,
  buildDefaultExceptionEntry,
} from './ScheduleExceptionsForm';
import type { ExceptionEntry, WeeklyFormState } from './types';
import {
  WeeklyScheduleEditor,
  buildDefaultWeeklyState,
} from './WeeklyScheduleEditor';
import { ORDERED_DAYS } from './WeeklyScheduleEditor/DayRow';

// ─── State → GraphQL input ────────────────────────────────────────────────────

function buildScheduleInputs(
  scheduleType: ScheduleTypeChoices,
  weekly: WeeklyFormState,
  exceptions: ExceptionEntry[]
): ScheduleInput[] {
  const inputs: ScheduleInput[] = [];

  if (weekly.mode !== 'closed') {
    for (const { value: day } of ORDERED_DAYS) {
      const dayState = weekly.dayHours[day];
      if (!dayState.open) continue;

      const startTime =
        weekly.mode === 'same'
          ? weekly.sameHours.startTime
          : dayState.startTime;
      const endTime =
        weekly.mode === 'same' ? weekly.sameHours.endTime : dayState.endTime;

      if (!startTime || !endTime) continue;

      inputs.push({
        scheduleType,
        days: [day],
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
        isException: false,
      });
    }
  }

  for (const ex of exceptions) {
    if (!ex.startDate) continue;

    inputs.push({
      scheduleType,
      startDate: ex.startDate,
      endDate: ex.endDate || ex.startDate,
      startTime: ex.closedAllDay
        ? undefined
        : ex.startTime.length === 5
        ? `${ex.startTime}:00`
        : ex.startTime || undefined,
      endTime: ex.closedAllDay
        ? undefined
        : ex.endTime.length === 5
        ? `${ex.endTime}:00`
        : ex.endTime || undefined,
      condition: ex.condition,
      isException: true,
    });
  }

  return inputs;
}

// ─── GraphQL → form state ────────────────────────────────────────────────────

/** Strip seconds from "HH:MM:SS" → "HH:MM", pass through "HH:MM", return "" for nullish. */
function toHHMM(time: string | null | undefined): string {
  if (!time) return '';
  return String(time).slice(0, 5);
}

function hydrateExceptions(schedules: ScheduleType[]): ExceptionEntry[] {
  let _id = 0;
  return schedules.map((s) => ({
    localId: s.id ?? String(++_id),
    startDate: s.startDate ?? '',
    endDate: s.endDate ?? s.startDate ?? '',
    closedAllDay: !s.startTime && !s.endTime,
    startTime: toHHMM(s.startTime),
    endTime: toHHMM(s.endTime),
    condition: s.condition ?? undefined,
  }));
}

function hydrateWeekly(schedules: ScheduleType[]): WeeklyFormState {
  const defaults = buildDefaultWeeklyState();

  if (schedules.length === 0) {
    return { ...defaults, mode: 'closed' };
  }

  const dayHours = { ...defaults.dayHours };
  for (const entry of schedules) {
    if (!entry.day) continue;
    dayHours[entry.day] = {
      open: true,
      startTime: toHHMM(entry.startTime),
      endTime: toHHMM(entry.endTime),
    };
  }

  // Detect 'same' mode: all entries share identical times
  const uniqueTimes = new Set(
    schedules.map((e) => `${e.startTime ?? ''}|${e.endTime ?? ''}`)
  );
  if (uniqueTimes.size === 1 && schedules.length > 0) {
    const first = schedules[0];
    return {
      mode: 'same',
      sameHours: {
        startTime: toHHMM(first.startTime),
        endTime: toHHMM(first.endTime),
      },
      dayHours,
    };
  }

  return { mode: 'mixed', sameHours: defaults.sameHours, dayHours };
}

// ─── Component ────────────────────────────────────────────────────────────────

type TProps = {
  scheduleType: ScheduleTypeChoices;
  initialSchedules?: ScheduleType[];
  onSave: (inputs: ScheduleInput[]) => void;
  onCancel?: () => void;
};

export function ScheduleForm(props: TProps) {
  const { scheduleType, initialSchedules, onSave, onCancel } = props;

  const weeklySchedules = initialSchedules?.filter((s) => !s.isException) ?? [];
  const exceptionSchedules =
    initialSchedules?.filter((s) => s.isException) ?? [];

  const [weekly, setWeekly] = useState<WeeklyFormState>(() =>
    weeklySchedules.length > 0
      ? hydrateWeekly(weeklySchedules)
      : buildDefaultWeeklyState()
  );
  const [exceptions, setExceptions] = useState<ExceptionEntry[]>(() =>
    hydrateExceptions(exceptionSchedules)
  );

  const handleSave = () => {
    onSave(buildScheduleInputs(scheduleType, weekly, exceptions));
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Weekly Hours
        </h3>
        <WeeklyScheduleEditor value={weekly} onChange={setWeekly} />
      </section>

      <div className="border-t border-gray-200" />

      <section>
        <ScheduleExceptionsForm value={exceptions} onChange={setExceptions} />
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Save Schedule
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// Re-export for convenience
export { buildDefaultExceptionEntry };

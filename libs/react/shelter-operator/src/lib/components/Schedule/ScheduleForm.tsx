import {
  ScheduleTypeChoices,
  type ScheduleInput,
  type ScheduleType,
} from '@monorepo/react/shelter';
import { useState } from 'react';
import { Button } from '../base-ui/buttons';
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

export type { WeeklyFormState };

// ─── State → GraphQL input ────────────────────────────────────────────────────

function buildScheduleInputs(
  scheduleType: ScheduleTypeChoices,
  weekly: WeeklyFormState,
  exceptions: ExceptionEntry[]
): ScheduleInput[] {
  const inputs: ScheduleInput[] = [];

  for (const { value: day } of ORDERED_DAYS) {
    const { open, startTime, endTime } = weekly[day];
    if (!open || !startTime || !endTime) continue;

    inputs.push({
      scheduleType,
      days: [day],
      startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      isException: false,
    });
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
  if (!time) {
    return '';
  }

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
  const state = buildDefaultWeeklyState();
  for (const entry of schedules) {
    if (!entry.day) continue;
    state[entry.day] = {
      open: true,
      startTime: toHHMM(entry.startTime),
      endTime: toHHMM(entry.endTime),
    };
  }
  return state;
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
        <Button variant="floating" onClick={handleSave}>
          Save Schedule
        </Button>
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

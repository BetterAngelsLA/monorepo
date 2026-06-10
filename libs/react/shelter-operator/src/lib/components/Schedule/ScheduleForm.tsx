import { mergeCss } from '@monorepo/react/shared';
import {
  ScheduleTypeChoices,
  type ScheduleInput,
  type ScheduleType,
} from '@monorepo/react/shelter';
import { useState } from 'react';
import { Button } from '../base-ui/buttons';
import { ScheduleExceptionsForm } from './ScheduleExceptionsForm';
import type { ExceptionEntry, WeeklyFormState } from './types';
import { buildScheduleInputs, hydrateExceptions, hydrateWeekly } from './utils';
import {
  WeeklyScheduleEditor,
  buildDefaultWeeklyState,
} from './WeeklyScheduleEditor';

type TProps = {
  scheduleType: ScheduleTypeChoices;
  initialSchedules?: ScheduleType[];
  onSave: (inputs: ScheduleInput[]) => void;
  onCancel?: () => void;
  className?: string;
};

export function ScheduleForm(props: TProps) {
  const { scheduleType, initialSchedules, onSave, onCancel, className } = props;

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
    <div className={mergeCss(['space-y-8', className])}>
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

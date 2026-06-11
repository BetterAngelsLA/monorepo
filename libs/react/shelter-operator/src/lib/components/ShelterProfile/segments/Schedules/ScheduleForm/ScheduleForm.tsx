import { zodResolver } from '@hookform/resolvers/zod';
import { mergeCss } from '@monorepo/react/shared';
import {
  ScheduleTypeChoices,
  type ScheduleInput,
  type ScheduleType,
} from '@monorepo/react/shelter';
import { Trash } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Button } from '../../../../base-ui/buttons';
import { Form } from '../../../../form/Form';
import { scheduleFormSchema, type ScheduleFormData } from './formSchema';
import { ScheduleExceptionsForm } from './ScheduleExceptionsForm';
import type { DayErrors, WeeklyFormState } from './types';
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
  onDelete?: () => void;
  disabled?: boolean;
  className?: string;
};

function buildDefaultValues(
  initialSchedules?: ScheduleType[]
): ScheduleFormData {
  const weeklySchedules = initialSchedules?.filter((s) => !s.isException) ?? [];
  const exceptionSchedules =
    initialSchedules?.filter((s) => s.isException) ?? [];

  return {
    weekly:
      weeklySchedules.length > 0
        ? hydrateWeekly(weeklySchedules)
        : buildDefaultWeeklyState(),
    exceptions: hydrateExceptions(exceptionSchedules),
  };
}

export function ScheduleForm(props: TProps) {
  const {
    scheduleType,
    initialSchedules,
    onSave,
    onCancel,
    onDelete,
    disabled,
    className,
  } = props;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitted },
    reset,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: buildDefaultValues(initialSchedules),
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'exceptions',
    keyName: '_rhfId',
  });

  const weekly = watch('weekly');

  function onSetWeekly(next: WeeklyFormState, validate = true) {
    setValue('weekly', next);

    if (isSubmitted && validate) {
      trigger('weekly');
    }
  }

  function onSubmit(data: ScheduleFormData) {
    onSave(buildScheduleInputs(scheduleType, data.weekly, data.exceptions));
  }

  function handleCancel() {
    reset();
    onCancel?.();
  }

  return (
    <div className={mergeCss(['space-y-8', className])}>
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex justify-between">
          Weekly Hours
          {onDelete && (
            <Button
              variant="primary-sm"
              onClick={onDelete}
              disabled={disabled || initialSchedules?.length === 0}
              aria-label="Remove schedule"
              leftIcon={<Trash size={14} />}
            >
              Remove Schedule
            </Button>
          )}
        </h3>

        <WeeklyScheduleEditor
          value={weekly}
          onChange={onSetWeekly}
          errors={errors.weekly as Record<string, DayErrors> | undefined}
          disabled={disabled}
        />
      </section>

      <div className="border-t border-gray-200" />

      <section>
        <ScheduleExceptionsForm
          fields={fields}
          control={control}
          onAdd={append}
          onRemove={remove}
          trigger={trigger}
          isSubmitted={isSubmitted}
          disabled={disabled}
        />
      </section>

      <div className="flex gap-3 pt-2">
        <Form.Actions
          primaryLabel="Save Schedule"
          onPrimaryClick={handleSubmit(onSubmit)}
          onSecondaryClick={handleCancel}
          primaryDisabled={disabled}
          secondaryDisabled={disabled}
          className="z-99"
        />
      </div>
    </div>
  );
}

import { Plus } from 'lucide-react';
import {
  Controller,
  type Control,
  type FieldArrayWithId,
  type UseFormTrigger,
} from 'react-hook-form';
import type { ScheduleFormData } from '../formSchema';
import { ExceptionRow, type ExceptionErrors } from './ExceptionRow';
import { buildDefaultExceptionEntry } from './utils';

type TProps = {
  fields: FieldArrayWithId<ScheduleFormData, 'exceptions', '_rhfId'>[];
  control: Control<ScheduleFormData>;
  onAdd: (entry: ScheduleFormData['exceptions'][number]) => void;
  onRemove: (index: number) => void;
  trigger: UseFormTrigger<ScheduleFormData>;
  isSubmitted: boolean;
  disabled?: boolean;
};

export function ScheduleExceptionsForm(props: TProps) {
  const { fields, control, onAdd, onRemove, trigger, isSubmitted, disabled } =
    props;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Exceptions</h4>

      {fields.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No exceptions configured.
        </p>
      )}

      {fields.map((field, index) => (
        <Controller
          key={field._rhfId}
          name={`exceptions.${index}`}
          control={control}
          render={({ field: { value, onChange }, fieldState }) => (
            <ExceptionRow
              entry={value}
              onChange={(patch) => {
                onChange({ ...value, ...patch });

                if (isSubmitted) {
                  trigger(`exceptions.${index}`);
                }
              }}
              onRemove={() => onRemove(index)}
              errors={fieldState.error as ExceptionErrors | undefined}
              disabled={disabled}
            />
          )}
        />
      ))}

      <button
        type="button"
        onClick={() => onAdd(buildDefaultExceptionEntry())}
        className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium"
        disabled={disabled}
      >
        <Plus size={15} />
        Add exception
      </button>
    </div>
  );
}

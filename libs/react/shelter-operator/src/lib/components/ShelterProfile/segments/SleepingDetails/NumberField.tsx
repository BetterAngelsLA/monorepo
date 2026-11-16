import { Controller, type Control } from 'react-hook-form';
import { Input } from '../../../base-ui/input';
import type { SleepingDetailsFormData } from './formSchema';

type TNumberFieldName = 'totalBeds' | 'nonRestrictedBeds' | 'restrictedBeds';

type TProps = {
  control: Control<SleepingDetailsFormData>;
  name: TNumberFieldName;
  label: string;
  error?: string;
  disabled?: boolean;
  isViewMode?: boolean;
};

export function NumberField({
  control,
  name,
  label,
  error,
  disabled = false,
  isViewMode = false,
}: TProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          label={label}
          dataType="number"
          value={field.value ?? ''}
          min={0}
          onChange={(event) => {
            const value = event.target.valueAsNumber;

            field.onChange(Number.isNaN(value) ? null : value);
          }}
          onBlur={field.onBlur}
          disabled={disabled}
          isViewMode={isViewMode}
          error={error}
        />
      )}
    />
  );
}

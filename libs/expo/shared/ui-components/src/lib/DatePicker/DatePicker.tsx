import { Controller, FieldValues } from 'react-hook-form';
import { NumericDatePicker } from './NumericDatePicker';
import { WheelDatePicker } from './WheelDatePicker';
import {
  IDatePickerProps,
  INumericDatePickerProps,
  IWheelDatePickerProps,
} from './types';

export function DatePicker<T extends FieldValues = FieldValues>(
  props: IDatePickerProps<T>
) {
  // Extract helperText if you added it to IDatePickerProps, or pass via ...rest
  const { type, control, name, rules, ...rest } = props;

  if (control && name) {
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({
          field: { value, onChange, onBlur },
          fieldState: { error },
        }) => {
          const sharedProps = { value, onChange, onBlur };

          if (type === 'numeric') {
            // FIX: Don't strip 'error'. Pass the message down.
            return (
              <NumericDatePicker
                {...(rest as INumericDatePickerProps)}
                {...sharedProps}
                errorMessage={error?.message} // Pass RHF error message
                // helperText={helperText} // Pass custom helper text
              />
            );
          }

          return (
            <WheelDatePicker
              {...(rest as IWheelDatePickerProps)}
              {...sharedProps}
            />
          );
        }}
      />
    );
  }

  // Non-RHF handling...
  if (type === 'numeric') {
    return (
      <NumericDatePicker
        {...(rest as INumericDatePickerProps)}
        // helperText={helperText}
      />
    );
  }

  return <WheelDatePicker {...(rest as IWheelDatePickerProps)} />;
}

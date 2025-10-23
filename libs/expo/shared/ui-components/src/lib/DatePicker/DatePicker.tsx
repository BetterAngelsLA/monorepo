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
  const { type, control, name, rules, ...rest } = props;

  if (control && name) {
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { value, onChange, onBlur } }) => {
          const sharedProps = { value, onChange, onBlur };

          if (type === 'numeric') {
            const { error: _unused, ...numericRest } = rest;

            return <NumericDatePicker {...numericRest} {...sharedProps} />;
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

  // non-RHF
  if (type === 'numeric') {
    return <NumericDatePicker {...(rest as INumericDatePickerProps)} />;
  }

  return <WheelDatePicker {...(rest as IWheelDatePickerProps)} />;
}

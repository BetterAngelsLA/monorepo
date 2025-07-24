import { Controller, FieldValues } from 'react-hook-form';
import { PhoneNumberInputBase } from './PhoneNumberInputBase';
import { TPhoneNumberInputProps } from './types';
import { defaultFormatValues } from './utils/defaultFormatValues';
import { defaultParseNumber } from './utils/defaultParseNumber';

export function PhoneNumberInput<
  TFieldValues extends FieldValues = FieldValues
>(props: TPhoneNumberInputProps<TFieldValues>) {
  const {
    control,
    name,
    value,
    rules,
    onChange,
    parseNumber = defaultParseNumber,
    formatValues = defaultFormatValues,
    error,
    ...rest
  } = props;

  if (control && name) {
    // When formState is not ready then no formState.values yet exist,
    // and PhoneNumberInputBase will initialize with undefined values
    // which will not update.
    if (!control._formState.isReady) {
      return null;
    }

    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => {
          const { value, onChange } = field;
          const { error } = fieldState;

          const [number, extension] = parseNumber(value);

          return (
            <PhoneNumberInputBase
              phoneNumber={number}
              extension={extension}
              onChangeParts={(num, ext) => onChange(formatValues(num, ext))}
              error={error?.message}
              {...rest}
            />
          );
        }}
      />
    );
  }

  const [number, extension] = parseNumber(value || '');

  return (
    <PhoneNumberInputBase
      phoneNumber={number}
      extension={extension}
      onChangeParts={(num, ext) => onChange?.(formatValues(num, ext))}
      error={error}
      {...rest}
    />
  );
}

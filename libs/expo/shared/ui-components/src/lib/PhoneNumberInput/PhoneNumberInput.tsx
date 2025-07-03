import { Controller, FieldValues } from 'react-hook-form';
import { PhoneNumberInputBase } from './PhoneNumberInputBase';
import { TPhoneNumberInputProps } from './types';
import { defaultFormatValues } from './utils/defaultFormatValues';
import { defaultParseNumber } from './utils/defaultParseNumber';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

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

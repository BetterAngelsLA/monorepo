import { Controller, FieldValues } from 'react-hook-form';
import { renderPhoneNumberBase } from './renderPhoneNumberBase';
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
    ...rest
  } = props;

  if (control && name) {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => {
          const { value, onChange, onBlur } = field;
          const { error } = fieldState;

          return renderPhoneNumberBase({
            value: value ?? '',
            onChange: onChange,
            onBlur: onBlur,
            error: error?.message,
            parseNumber,
            formatValues,
            rest,
          });
        }}
      />
    );
  }

  return renderPhoneNumberBase({
    value: value ?? '',
    onChange: onChange ?? noop,
    parseNumber,
    formatValues,
    rest,
  });
}

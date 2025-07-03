import { Controller } from 'react-hook-form';
import { PhoneNumberUncontrolled } from './PhoneNumberUncontrolled';
import { IPhoneNumberInputProps } from './types';
import { defaultFormatValues } from './utils/defaultFormatValues';
import { defaultParseNumber } from './utils/defaultParseNumber';

export function PhoneNumberInput(props: IPhoneNumberInputProps) {
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

  function renderBase(
    currentValue: string,
    onChangeCb: (v: string) => void,
    errorMessage?: string,
    onBlur?: () => void
  ) {
    const [number, ext] = parseNumber(currentValue);

    return (
      <PhoneNumberUncontrolled
        phoneNumber={number}
        extension={ext}
        onBlur={onBlur}
        onChangeParts={(num, ext) => {
          const formatted = formatValues(num, ext);

          onChangeCb(formatted);
        }}
        errors={errorMessage}
        {...rest}
      />
    );
  }

  if (control && name) {
    // console.log('################################### PHONE INPUT - CONTROLLED');
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => {
          const { value = '', onChange, onBlur } = field;
          const { error } = fieldState;

          return renderBase(value, onChange, error?.message, onBlur);
        }}
      />
    );
  }

  //   console.log('################################### PHONE INPUT - BASE');

  return renderBase(value || '', onChange || (() => {}));
}

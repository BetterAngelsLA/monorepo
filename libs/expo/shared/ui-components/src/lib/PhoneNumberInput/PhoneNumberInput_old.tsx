import { Controller } from 'react-hook-form';
import { PhoneNumberInputBase } from './PhoneNumberInputBase';
import { IPhoneNumberInputProps } from './types';

export function PhoneNumberInput(props: IPhoneNumberInputProps) {
  const { name, control, rules, value, onChange, ...rest } = props;
  if (!control || !name) {
    return <PhoneNumberInputBase value={value} onChange={onChange} {...rest} />;
  }

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange } }) => (
        <PhoneNumberInputBase
          onChange={onChange}
          value={value}
          // onBlur={() => handleBlur(onBlur)}
          {...rest}
        />
      )}
    />
  );
}

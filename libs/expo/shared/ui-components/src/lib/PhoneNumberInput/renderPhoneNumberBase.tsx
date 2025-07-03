import { PhoneNumberInputBase } from './PhoneNumberInputBase';
import { TPhoneNumberInputSharedProps, TPhoneWithExtension } from './types';

type TRenderPhoneNumberBase = {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  parseNumber: (val: string) => TPhoneWithExtension;
  formatValues: (num: string, ext?: string) => string;
  rest: Omit<TPhoneNumberInputSharedProps, 'value' | 'onChange'>;
};

export function renderPhoneNumberBase(props: TRenderPhoneNumberBase) {
  const {
    value,
    onChange,
    onBlur,
    error,
    parseNumber,
    formatValues,
    rest,
  }: TRenderPhoneNumberBase = props;

  const [number, extension] = parseNumber(value);

  return (
    <PhoneNumberInputBase
      phoneNumber={number}
      extension={extension}
      onBlur={onBlur}
      onChangeParts={(num, ext) => onChange(formatValues(num, ext))}
      errors={error}
      {...rest}
    />
  );
}

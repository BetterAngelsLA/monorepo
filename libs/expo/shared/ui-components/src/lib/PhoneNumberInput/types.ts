import { Control, RegisterOptions } from 'react-hook-form';
import { ViewStyle } from 'react-native';

type TRules = Omit<
  RegisterOptions,
  'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
>;

export interface IPhoneNumberInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  parseNumber?: (value: string) => [string, string | undefined];
  formatValues?: (number: string, extension?: string) => string;
  placeholderNumber?: string;
  placeholderExt?: string;
  disabled?: boolean;
  errors?: string;
  label?: string;
  style?: ViewStyle;
  name?: string;
  control?: Control<any>;
  rules?: TRules;
}

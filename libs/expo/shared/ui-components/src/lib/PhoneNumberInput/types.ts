import {
  Control,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from 'react-hook-form';
import { ViewStyle } from 'react-native';

export type TPhoneWithExtension = [string, string | undefined];

type TControllerRules<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
> = Omit<
  RegisterOptions<TFieldValues, TName>,
  'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
>;

type TControlledProps<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
  TTransformedValues = TFieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  control: Control<TFieldValues, TContext, TTransformedValues>;
  name: TName;
  rules?: TControllerRules<TFieldValues, TName>;
};

type TUncontrolledProps = {
  control?: undefined;
  name?: undefined;
  rules?: undefined;
};

// internal
export type TPhoneNumberInputSharedProps = {
  value?: string;
  label?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  parseNumber?: (value: string) => TPhoneWithExtension;
  formatValues?: (number: string, extension?: string) => string;
  noExtension?: boolean;
  placeholderNumber?: string;
  placeholderExt?: string;
  disabled?: boolean;
  errors?: string;
  style?: ViewStyle;
};

// internal
export type TPhoneNumberInputBaseProps = Pick<
  TPhoneNumberInputSharedProps,
  'disabled' | 'label' | 'style' | 'errors' | 'noExtension'
> & {
  phoneNumber?: string;
  extension?: string;
  onChangeParts?: (phone: string, extension: string) => void;
  onBlur?: () => void;
};

// <PhoneNumberInput /> UI component
export type TPhoneNumberInputProps<
  TFieldValues extends FieldValues = FieldValues
> =
  | (TPhoneNumberInputSharedProps & TControlledProps<TFieldValues>)
  | (TPhoneNumberInputSharedProps & TUncontrolledProps);

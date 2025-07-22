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
type TPhoneNumberInputDisplayProps = {
  onClear?: () => void;
  disabled?: boolean;
  label?: string;
  style?: ViewStyle;
  error?: string;
  noExtension?: boolean;
  numberMaxLen?: number;
  extensionMaxLen?: number;
  placeholderNumber?: string;
  placeholderExt?: string;
};

type TPhoneNumberInputValueProps = {
  value?: string;
  onChange?: (value: string) => void;
  parseNumber?: (value: string) => TPhoneWithExtension;
  formatValues?: (number: string, extension?: string) => string;
};

export type TPhoneNumberInputBaseProps = TPhoneNumberInputDisplayProps & {
  phoneNumber?: string;
  extension?: string;
  onChangeParts?: (phone: string, extension: string) => void;
};

type TPhoneNumberInputSharedProps = TPhoneNumberInputDisplayProps &
  TPhoneNumberInputValueProps;

export type TPhoneNumberInputProps<
  TFieldValues extends FieldValues = FieldValues
> =
  | (TPhoneNumberInputSharedProps & TControlledProps<TFieldValues>)
  | (TPhoneNumberInputSharedProps & TUncontrolledProps);

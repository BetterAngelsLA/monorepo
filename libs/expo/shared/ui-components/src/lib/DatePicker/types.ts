import { TMarginProps } from '@monorepo/expo/shared/static';
import { ComponentProps } from 'react';
import { Control, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { StyleProp, ViewStyle } from 'react-native';
import { DatePickerInput } from 'react-native-paper-dates';

export type INumericDatePickerProps = Omit<
  ComponentProps<typeof DatePickerInput>,
  | 'locale'
  | 'inputMode'
  | 'mode'
  | 'iconColor'
  | 'textColor'
  | 'outlineColor'
  | 'outlineStyle'
  | 'withDateFormatInLabel'
> & {
  onDelete?: () => void;
};

export interface IWheelDatePickerProps extends TMarginProps {
  mode: 'date' | 'time';
  onChange: (date?: Date) => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  format: string;
  onBlur?: () => void;
  minDate?: Date;
  maxDate?: Date;
  value?: Date | null;
  onDelete?: () => void;
}

// ... Rest of the file (WithRHF, etc)

type OmittedRHFKeys = 'value' | 'onChange' | 'onBlur';

export type WithRHF<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  rules?: RegisterOptions<T, Path<T>>;
};

export type WithoutRHF = {
  control?: undefined;
  name?: undefined;
  rules?: never;
};

export type INumericWithRHF<T extends FieldValues> = { type: 'numeric' } & Omit<
  INumericDatePickerProps,
  OmittedRHFKeys
> &
  WithRHF<T>;

export type INumericPlain = { type: 'numeric' } & INumericDatePickerProps &
  WithoutRHF;

export type IWheelWithRHF<T extends FieldValues> = { type: 'wheel' } & Omit<
  IWheelDatePickerProps,
  OmittedRHFKeys
> &
  WithRHF<T>;

export type IWheelPlain = { type: 'wheel' } & IWheelDatePickerProps &
  WithoutRHF;

export type IDatePickerProps<T extends FieldValues> =
  | INumericWithRHF<T>
  | INumericPlain
  | IWheelWithRHF<T>
  | IWheelPlain;

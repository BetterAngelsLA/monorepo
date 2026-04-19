import type {
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

export type InputDataType =
  | 'string'
  | 'number'
  | 'email'
  | 'phone number'
  | 'time';
export type InputVariant = 'default' | 'paragraph';

export interface InputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement> &
      TextareaHTMLAttributes<HTMLTextAreaElement>,
    'size' | 'className' | 'type' | 'onBlur' | 'children'
  > {
  label?: string;
  error?: string;
  dataType?: InputDataType;
  variant?: InputVariant;
  type?: HTMLInputTypeAttribute;
  className?: string;
  containerClassName?: string;
  inputClassName?: string;
  isActive?: boolean;
  showErrorIcon?: boolean;
  isTouched?: boolean;
  onFocus?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onBlur?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  rightAdornment?: ReactNode;
}

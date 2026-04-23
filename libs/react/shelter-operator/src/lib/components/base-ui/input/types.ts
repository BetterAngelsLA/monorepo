import type {
  FocusEvent,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

export type InputDataType =
  | 'string'
  | 'number'
  | 'email'
  | 'phone-number'
  | 'time';
export type InputVariant = 'default' | 'paragraph';

type NativeAttrsOmit =
  | 'size'
  | 'className'
  | 'type'
  | 'onBlur'
  | 'children'
  | 'rows';

type SharedCustomProps = {
  label?: string;
  error?: string;
  dataType?: InputDataType;
  className?: string;
  containerClassName?: string;
  inputClassName?: string;
  isActive?: boolean;
  showErrorIcon?: boolean;
  isTouched?: boolean;
  /** Only applied when `variant` is `"paragraph"`. */
  rows?: number;
  onFocus?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  rightAdornment?: ReactNode;
};

export type InputProps =
  | (SharedCustomProps & {
      variant?: 'default';
    } & Omit<InputHTMLAttributes<HTMLInputElement>, NativeAttrsOmit>)
  | (SharedCustomProps & {
      variant: 'paragraph';
    } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, NativeAttrsOmit>);

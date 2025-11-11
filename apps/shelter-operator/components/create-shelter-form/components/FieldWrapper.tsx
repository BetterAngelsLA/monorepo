import type { ReactNode } from 'react';
import {
  ERROR_TEXT_CLASS,
  FIELD_WRAPPER_CLASS,
  HELPER_TEXT_CLASS,
  LABEL_CLASS,
} from '../constants/styles';

interface FieldWrapperProps {
  label: string;
  htmlFor?: string;
  helperText?: string;
  error?: string;
  children: ReactNode;
  messageId?: string;
}

export function FieldWrapper({
  label,
  htmlFor,
  helperText,
  error,
  children,
  messageId,
}: FieldWrapperProps) {
  return (
    <div className={FIELD_WRAPPER_CLASS}>
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={messageId} className={ERROR_TEXT_CLASS} data-testid="field-error">
          {error}
        </p>
      ) : helperText ? (
        <p id={messageId} className={HELPER_TEXT_CLASS}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

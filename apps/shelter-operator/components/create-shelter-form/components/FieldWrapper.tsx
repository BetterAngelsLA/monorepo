import type { ReactNode } from 'react';
import { FIELD_WRAPPER_CLASS, HELPER_TEXT_CLASS, LABEL_CLASS } from '../constants/styles';

interface FieldWrapperProps {
  label: string;
  htmlFor?: string;
  helperText?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, htmlFor, helperText, children }: FieldWrapperProps) {
  return (
    <div className={FIELD_WRAPPER_CLASS}>
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
      </label>
      {children}
      {helperText ? <p className={HELPER_TEXT_CLASS}>{helperText}</p> : null}
    </div>
  );
}

import clsx from 'clsx';
import type { HTMLInputTypeAttribute } from 'react';
import { INPUT_CLASS, INPUT_ERROR_CLASS } from '../constants/styles';
import { FieldWrapper } from './FieldWrapper';

interface TextFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  helperText?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
  onBlur?: () => void;
}

export function TextField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  helperText,
  required,
  autoComplete,
  error,
  onBlur,
}: TextFieldProps) {
  const messageId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined;

  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      helperText={helperText}
      error={error}
      messageId={messageId}
    >
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        onBlur={onBlur}
        className={clsx(INPUT_CLASS, error && INPUT_ERROR_CLASS)}
        aria-invalid={Boolean(error)}
        aria-describedby={messageId}
        required={required}
        autoComplete={autoComplete}
      />
    </FieldWrapper>
  );
}

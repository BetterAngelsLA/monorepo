import type { HTMLInputTypeAttribute } from 'react';
import { INPUT_CLASS } from '../constants/styles';
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
}: TextFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} helperText={helperText}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className={INPUT_CLASS}
        required={required}
        autoComplete={autoComplete}
      />
    </FieldWrapper>
  );
}

import clsx from 'clsx';
import { INPUT_CLASS, INPUT_ERROR_CLASS } from '../constants/styles';
import { FieldWrapper } from './FieldWrapper';
import type { SelectOption } from '../../../types';

interface SelectFieldProps<T extends string | number | null> {
  id: string;
  name: string;
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
}

export function SelectField<T extends string | number | null>({
  id,
  name,
  label,
  value,
  options,
  onChange,
  placeholder,
  helperText,
  error,
}: SelectFieldProps<T>) {
  const messageId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined;

  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      helperText={helperText}
      error={error}
      messageId={messageId}
    >
      <select
        id={id}
        name={name}
        className={clsx(INPUT_CLASS, error && INPUT_ERROR_CLASS)}
        value={value === null ? '' : (value as string | number)}
        onChange={event => {
          const raw = event.target.value;
          const match = options.find(option => {
            if (option.value === null) {
              return raw === '';
            }
            return String(option.value) === raw;
          });
          if (match) {
            onChange(match.value);
          }
        }}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={messageId}
      >
        {placeholder ? (
          <option value="" disabled={value !== null && value !== undefined}>
            {placeholder}
          </option>
        ) : null}
        {options.map(option => (
          <option key={String(option.value)} value={option.value ?? ''}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

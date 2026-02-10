import clsx from 'clsx';
import { INPUT_CLASS, INPUT_ERROR_CLASS } from './styles';
import { FieldWrapper } from './FieldWrapper';

export interface SelectOption<T extends string | number | null> {
  value: T;
  label: string;
}

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
  required?: boolean;
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
  required,
}: SelectFieldProps<T>) {
  const messageId = error ? `${id}-error` : helperText ? `${id}-helper` : undefined;

  return (
    <FieldWrapper
      label={label}
      htmlFor={id}
      helperText={helperText}
      error={error}
      messageId={messageId}
      required={required}
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
        required={required}
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

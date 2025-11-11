import clsx from 'clsx';
import { INPUT_CLASS, INPUT_ERROR_CLASS } from '../constants/styles';
import { FieldWrapper } from './FieldWrapper';

interface NumberFieldProps {
  id: string;
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  required?: boolean;
  error?: string;
  onBlur?: () => void;
}

export function NumberField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  helperText,
  required,
  error,
  onBlur,
}: NumberFieldProps) {
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
        type="number"
        value={Number.isNaN(value) ? '' : value}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={event => {
          const next = event.target.value;
          onChange(next === '' ? 0 : Number(next));
        }}
        onBlur={onBlur}
        className={clsx(INPUT_CLASS, error && INPUT_ERROR_CLASS)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={messageId}
        required={required}
      />
    </FieldWrapper>
  );
}

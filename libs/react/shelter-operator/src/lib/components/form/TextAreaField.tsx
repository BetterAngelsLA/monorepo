import clsx from 'clsx';
import { INPUT_ERROR_CLASS, TEXTAREA_CLASS } from './styles';
import { FieldWrapper } from './FieldWrapper';

interface TextAreaFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  helperText?: string;
  error?: string;
  onBlur?: () => void;
  required?: boolean;
}

export function TextAreaField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  helperText,
  error,
  onBlur,
  required,
}: TextAreaFieldProps) {
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
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        onBlur={onBlur}
        className={clsx(TEXTAREA_CLASS, error && INPUT_ERROR_CLASS)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={messageId}
        required={required}
      />
    </FieldWrapper>
  );
}

import { TEXTAREA_CLASS } from '../constants/styles';
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
}: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} helperText={helperText}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className={TEXTAREA_CLASS}
      />
    </FieldWrapper>
  );
}

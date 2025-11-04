import { INPUT_CLASS } from '../constants/styles';
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
}: NumberFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} helperText={helperText}>
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
        className={INPUT_CLASS}
        required={required}
      />
    </FieldWrapper>
  );
}

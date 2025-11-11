import { OPTION_ITEM_CLASS, OPTION_LIST_CLASS } from '../constants/styles';
import { FieldWrapper } from './FieldWrapper';

export interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  name: string;
  label: string;
  options: readonly CheckboxOption[];
  values: readonly string[];
  onChange: (values: string[]) => void;
  helperText?: string;
  error?: string;
}

export function CheckboxGroup({
  name,
  label,
  options,
  values,
  onChange,
  helperText,
  error,
}: CheckboxGroupProps) {
  const messageId = error ? `${name}-error` : helperText ? `${name}-helper` : undefined;

  return (
    <FieldWrapper label={label} helperText={helperText} error={error} messageId={messageId}>
      <div
        className={OPTION_LIST_CLASS}
        role="group"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={messageId}
      >
        {options.map(option => {
          const checked = values.includes(option.value);
          const id = `${name}-${option.value}`;
          return (
            <label key={option.value} htmlFor={id} className={OPTION_ITEM_CLASS}>
              <input
                id={id}
                name={name}
                type="checkbox"
                checked={checked}
                value={option.value}
                onChange={() => {
                  const nextValues = checked
                    ? values.filter(item => item !== option.value)
                    : [...values, option.value];
                  onChange(nextValues);
                }}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </FieldWrapper>
  );
}

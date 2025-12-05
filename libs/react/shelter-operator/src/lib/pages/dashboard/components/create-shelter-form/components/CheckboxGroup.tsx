import { OPTION_ITEM_CLASS, OPTION_LIST_CLASS } from '../constants/styles';
import { FieldWrapper } from './FieldWrapper';

export interface CheckboxOption<T extends string = string> {
  value: T;
  label: string;
}

interface CheckboxGroupProps<T extends string = string> {
  name: string;
  label: string;
  options: readonly CheckboxOption<T>[];
  values: readonly T[];
  onChange: (values: T[]) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export function CheckboxGroup<Choice extends string = string>({
  name,
  label,
  options,
  values,
  onChange,
  helperText,
  error,
  required,
}: CheckboxGroupProps<Choice>) {
  const messageId = error ? `${name}-error` : helperText ? `${name}-helper` : undefined;

  return (
    <FieldWrapper
      label={label}
      helperText={helperText}
      error={error}
      messageId={messageId}
      required={required}
    >
      <div
        className={OPTION_LIST_CLASS}
        role="group"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={messageId}
        aria-required={required ? 'true' : undefined}
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

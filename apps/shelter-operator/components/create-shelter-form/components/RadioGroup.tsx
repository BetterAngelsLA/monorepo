import { OPTION_ITEM_CLASS, OPTION_LIST_CLASS } from '../constants/styles';
import { FieldWrapper } from './FieldWrapper';

export interface RadioOption<T> {
  value: T;
  label: string;
}

interface RadioGroupProps<T> {
  name: string;
  label: string;
  options: readonly RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  helperText?: string;
  error?: string;
}

export function RadioGroup<T>({
  name,
  label,
  options,
  value,
  onChange,
  helperText,
  error,
}: RadioGroupProps<T>) {
  const messageId = error ? `${name}-error` : helperText ? `${name}-helper` : undefined;

  return (
    <FieldWrapper label={label} helperText={helperText} error={error} messageId={messageId}>
      <div
        className={OPTION_LIST_CLASS}
        role="radiogroup"
        aria-invalid={Boolean(error)}
        aria-describedby={messageId}
      >
        {options.map(option => {
          const id = `${name}-${String(option.value)}`;
          return (
            <label key={id} htmlFor={id} className={OPTION_ITEM_CLASS}>
              <input
                id={id}
                name={name}
                type="radio"
                checked={Object.is(value, option.value)}
                onChange={() => onChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </FieldWrapper>
  );
}

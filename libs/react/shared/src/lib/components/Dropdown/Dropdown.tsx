import { SelectHTMLAttributes, useId } from 'react';
import { mergeCss } from '../../utils';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  selectClassname?: string;
  error?: string;
}

export function Dropdown(props: DropdownProps) {
  const {
    label,
    id: propId,
    options,
    value,
    onChange,
    error,
    className,
    selectClassname,
    disabled,
    ...rest
  } = props;

  const generatedId = useId();
  const id = propId ?? generatedId;

  const parentCss = ['flex', 'flex-col', className];
  const labelCss = ['text-sm', 'ml-1', 'mb-2', 'flex', 'flex-row'];
  const selectCss = [
    'bg-neutral-99',
    'rounded-lg',
    'focus:outline-hidden',
    'px-4',
    'py-4',
    'cursor-pointer',
    selectClassname,
  ];
  const errorCss = ['text-sm', 'text-alert-60', 'mt-2'];

  return (
    <div className={mergeCss(parentCss)}>
      {label && (
        <label htmlFor={id} className={mergeCss(labelCss)}>
          {label}
        </label>
      )}

      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={mergeCss(selectCss)}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <div className={mergeCss(errorCss)}>{error}</div>}
    </div>
  );
}

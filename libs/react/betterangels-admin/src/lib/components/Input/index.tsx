import { InputHTMLAttributes, useId } from 'react';
import './index.css';

interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  inputClassname?: string;
  error?: string;
}

export default function Input(props: IInputProps) {
  const {
    label,
    id: propId,
    error,
    className,
    inputClassname,
    ...rest
  } = props;
  const generatedId = useId();
  const id = propId ?? generatedId;

  const isRequired = props.required;

  return (
    <div className={`flex flex-col ${className || ''}`}>
      {label && (
        <label htmlFor={id} className="text-sm ml-1 mb-2 flex flex-row">
          {label}

          {isRequired && <div className="ml-1 text-alert-60">*</div>}
        </label>
      )}
      <input
        className={`bg-neutral-99 rounded-lg  focus:outline-none px-4 py-4 ${
          inputClassname || ''
        }`}
        id={id}
        {...rest}
      />

      {error && <div className="text-sm text-alert-60 mt-2">{error}</div>}
    </div>
  );
}

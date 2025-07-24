import { InputHTMLAttributes, useId } from 'react';

interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input(props: IInputProps) {
  const { label, id: propId, ...rest } = props;
  const generatedId = useId();
  const id = propId ?? generatedId;

  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={id} className="text-sm ml-1 mb-1">
          {label}
        </label>
      )}
      <input className="bg-neutral-99 px-4 py-4 rounded-lg" id={id} {...rest} />
    </div>
  );
}

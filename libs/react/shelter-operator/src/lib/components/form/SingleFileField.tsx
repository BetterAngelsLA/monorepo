import { FieldWrapper } from './FieldWrapper';

interface SingleFileFieldProps {
  id: string;
  name: string;
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  helperText?: string;
  accept?: string;
}

export function SingleFileField({
  id,
  name,
  label,
  value,
  onChange,
  helperText,
  accept,
}: SingleFileFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} helperText={helperText}>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        onChange={event => {
          const file = event.target.files?.[0] ?? null;
          onChange(file);
        }}
      />
      {value ? <p className="text-sm text-gray-600">Selected: {value.name}</p> : null}
    </FieldWrapper>
  );
}

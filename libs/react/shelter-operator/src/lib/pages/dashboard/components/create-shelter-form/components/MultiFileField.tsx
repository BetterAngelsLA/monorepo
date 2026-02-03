import { FieldWrapper } from './FieldWrapper';

interface MultiFileFieldProps {
  id: string;
  name: string;
  label: string;
  values: File[];
  onChange: (files: File[]) => void;
  helperText?: string;
  accept?: string;
}

export function MultiFileField({
  id,
  name,
  label,
  values,
  onChange,
  helperText,
  accept,
}: MultiFileFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} helperText={helperText}>
      <input
        id={id}
        name={name}
        type="file"
        multiple
        accept={accept}
        onChange={event => {
          const files = event.target.files ? Array.from(event.target.files) : [];
          onChange(files);
        }}
      />
      {values.length > 0 ? (
        <ul className="text-sm text-gray-600 list-disc list-inside">
          {values.map(file => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      ) : null}
    </FieldWrapper>
  );
}

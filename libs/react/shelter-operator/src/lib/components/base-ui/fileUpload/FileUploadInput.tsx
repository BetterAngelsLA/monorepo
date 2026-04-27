import { mergeCss } from '@monorepo/react/shared';
import { AlertCircle, FileUp } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Text } from '../text/text';

export interface FileUploadInputProps {
  id?: string;
  label?: string;
  value?: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  supportedFilesText?: string;
  browseText?: string;
  dragText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  isTouched?: boolean;
}

export function FileUploadInput({
  id,
  label,
  value,
  onChange,
  accept,
  multiple = false,
  supportedFilesText = 'Files supported: PNG, JPEG, PDF',
  browseText = 'Browse',
  dragText = 'or drag your file here',
  error,
  required = false,
  disabled = false,
  className,
  isTouched,
}: FileUploadInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const shouldShowError = Boolean(error && isTouched);
  const selectedFiles = value ?? [];

  const toFileArray = (fileList: FileList | null) =>
    fileList ? Array.from(fileList) : [];

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div
      className={mergeCss(['relative flex w-full flex-col gap-1', className])}
    >
      {label && (
        <label htmlFor={inputId} className="text-sm text-gray-900">
          <Text variant="body" className="text-gray-900">
            {label}
          </Text>
          {required && (
            <Text variant="body" className="text-red-500">
              {' '}
              *
            </Text>
          )}
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => onChange(toFileArray(event.target.files))}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-describedby={shouldShowError ? messageId : undefined}
        aria-disabled={disabled}
        className={mergeCss([
          'rounded-[2rem] border-2 border-dashed px-6 py-10 text-center transition-colors',
          shouldShowError
            ? 'border-red-500 bg-red-50'
            : isDragging
            ? 'border-[#008CEE] bg-blue-50'
            : 'border-gray-300 bg-white',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        ])}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          setIsDragging(false);
          onChange(toFileArray(event.dataTransfer.files));
        }}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center gap-1">
          <FileUp size={34} className="text-gray-400" aria-hidden="true" />

          <Text variant="caption" className="text-gray-900">
            <button
              type="button"
              className="text-[#2F80ED]"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                openPicker();
              }}
            >
              {browseText}
            </button>{' '}
            {dragText}
          </Text>

          <Text variant="caption-sm" className="text-gray-400">
            {supportedFilesText}
          </Text>

          {selectedFiles.length > 0 ? (
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm text-gray-600">
              {selectedFiles.map((file) => (
                <span
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1"
                >
                  {file.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {shouldShowError ? (
        <Text
          id={messageId}
          variant="caption"
          className="mt-1 flex items-center gap-1 text-red-500"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </Text>
      ) : null}
    </div>
  );
}

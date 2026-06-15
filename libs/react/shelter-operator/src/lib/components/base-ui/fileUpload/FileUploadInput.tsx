import { mergeCss, TMimeType } from '@monorepo/react/shared';
import { AlertCircle, FileUp } from 'lucide-react';
import { useId } from 'react';
import { useDropzone } from 'react-dropzone';
import { Label } from '../label';
import { Text } from '../text/text';
import { getSupportedFilesText } from './utils/getSupportedFilesText';

export interface FileUploadInputProps {
  id?: string;
  label?: string;
  value?: File[];
  onChange: (files: File[]) => void;
  acceptedMimeTypes?: TMimeType[];
  multiple?: boolean;
  supportedFilesText?: string;
  browseText?: string;
  dragText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  isTouched?: boolean;
  isViewMode?: boolean;
}

export function FileUploadInput({
  id,
  label,
  value,
  onChange,
  acceptedMimeTypes,
  multiple = false,
  supportedFilesText,
  browseText = 'Browse',
  dragText = 'or drag your file here',
  error,
  required = false,
  disabled = false,
  isViewMode,
  className,
  isTouched,
}: FileUploadInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  const shouldShowError = Boolean(error && isTouched);
  const selectedFiles = value ?? [];

  const isViewEditMode = typeof isViewMode === 'boolean';

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: acceptedMimeTypes
      ? Object.fromEntries(acceptedMimeTypes.map((m) => [m, []]))
      : undefined,
    multiple,
    disabled,
    onDrop: (acceptedFiles) => onChange(acceptedFiles),
  });

  return (
    <div
      className={mergeCss(['relative flex w-full flex-col gap-1', className])}
    >
      {label && (
        <Label
          label={label}
          inputId={inputId}
          variant={isViewEditMode ? 'offset' : undefined}
          required={required}
        />
      )}

      <input
        {...getInputProps({
          id: inputId,
          'aria-invalid': shouldShowError,
          'aria-describedby': shouldShowError ? messageId : undefined,
        })}
      />

      <div
        {...getRootProps()}
        className={mergeCss([
          'rounded-[2rem] border-2 border-dashed px-6 py-10 text-center transition-colors',
          shouldShowError
            ? 'border-red-500 bg-red-50'
            : isDragActive
            ? 'border-[#008CEE] bg-blue-50'
            : 'border-gray-300 bg-white',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        ])}
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
                open();
              }}
            >
              {browseText}
            </button>{' '}
            {dragText}
          </Text>

          <Text variant="caption-sm" className="text-gray-400">
            {supportedFilesText ?? getSupportedFilesText(acceptedMimeTypes)}
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

      {shouldShowError && (
        <Text
          id={messageId}
          variant="caption"
          className="mt-1 flex items-center gap-1 text-red-500"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </Text>
      )}
    </div>
  );
}

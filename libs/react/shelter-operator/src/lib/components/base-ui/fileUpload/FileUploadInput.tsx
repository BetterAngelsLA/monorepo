import { mergeCss, TMimeType } from '@monorepo/react/shared';
import { AlertCircle, FileUp } from 'lucide-react';
import { useId, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Label } from '../label';
import { LabelVariant } from '../label/label';
import { Text } from '../text/text';
import { getSupportedFilesText } from './utils/getSupportedFilesText';

export interface FileUploadInputProps {
  id?: string;
  label?: string;
  labelVariant?: LabelVariant;
  value?: File[];
  onChange: (files: File[]) => void;
  acceptedMimeTypes?: TMimeType[];
  maxFilesizeBytes?: number;
  multiple?: boolean;
  supportedFilesText?: string;
  browseText?: string;
  dragText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassname?: string;
  isViewMode?: boolean;
}

export function FileUploadInput({
  id,
  label,
  labelVariant,
  value,
  onChange,
  acceptedMimeTypes,
  maxFilesizeBytes,
  multiple = false,
  supportedFilesText,
  browseText = 'Browse',
  dragText = 'or drag your file here',
  error,
  required = false,
  disabled = false,
  className,
  labelClassname,
}: FileUploadInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  const [dropzoneError, setDropzoneError] = useState<string | null>(null);
  const selectedFiles = value ?? [];

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: acceptedMimeTypes
      ? Object.fromEntries(acceptedMimeTypes.map((m) => [m, []]))
      : undefined,
    maxSize: maxFilesizeBytes,
    multiple,
    disabled,
    onDrop: (acceptedFiles) => {
      setDropzoneError(null);

      if (acceptedFiles.length > 0) {
        onChange(acceptedFiles);
      }
    },
    onDropRejected: (fileRejections) => {
      const oversizedFilenames = fileRejections
        .filter((r) => r.errors.some((e) => e.code === 'file-too-large'))
        .map((r) => r.file.name);

      setDropzoneError(
        oversizedFilenames.length
          ? `File${
              oversizedFilenames.length > 1 ? 's' : ''
            } too large: ${oversizedFilenames.join(', ')}`
          : null
      );
    },
  });

  const displayError = error ?? dropzoneError;
  const shouldShowError = Boolean(displayError);

  return (
    <div
      className={mergeCss(['relative flex w-full flex-col gap-1', className])}
    >
      {label && (
        <Label
          label={label}
          variant={labelVariant}
          className={labelClassname}
          inputId={inputId}
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
          {displayError}
        </Text>
      )}
    </div>
  );
}

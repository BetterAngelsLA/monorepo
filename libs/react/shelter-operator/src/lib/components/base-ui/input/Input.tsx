import { mergeCss } from '@monorepo/react/shared';
import { AlertCircle } from 'lucide-react';
import { forwardRef, useId, useState } from 'react';
import { Text } from '../text/text';
import type { InputDataType, InputProps } from './types';

const validationPatterns: Record<InputDataType, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  'phone number': /^[\d\s\-+()]*\d[\d\s\-+()]*$/,
  number: /^-?\d+(\.\d+)?$/,
  time: /^([01]\d|2[0-3]):([0-5]\d)$/,
  string: /^.+$/, // Any non-empty string
};

const normalizeValue = (
  value: string | number | readonly string[] | undefined
): string => {
  if (value === undefined) return '';
  if (Array.isArray(value)) {
    // For multi-value inputs, treat concatenated trimmed values as the content
    return value.join('').trim();
  }
  return String(value).trim();
};

const isValueValid = (
  value: string | number | readonly string[] | undefined,
  dataType?: InputDataType
): boolean => {
  if (!dataType || !value) return true; // No validation if no dataType or empty value
  const stringValue = normalizeValue(value);
  if (!stringValue) return false; // Empty value is invalid
  const pattern = validationPatterns[dataType];
  return pattern.test(stringValue);
};

const getDefaultErrorMessage = (
  dataType?: string,
  isRequiredError?: boolean
): string | undefined => {
  if (isRequiredError) {
    return 'This field is required';
  }
  if (dataType) {
    return `Please enter a valid ${dataType}`;
  }
  return undefined;
};

export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>(function Input(
  {
    id,
    label,
    error,
    dataType,
    variant = 'default',
    rows,
    required = false,
    disabled = false,
    className,
    containerClassName,
    inputClassName,
    isActive = false,
    showErrorIcon = true,
    isTouched: controlledTouched,
    onFocus: externalOnFocus,
    onBlur: externalOnBlur,
    rightAdornment,
    value,
    ...inputProps
  },
  ref
) {
  const [internalTouched, setInternalTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isTouched = controlledTouched ?? internalTouched;
  const isParagraph = variant === 'paragraph';
  const paragraphRows = rows ?? 3;

  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  // Determine if there's a required validation error
  const isRequiredError = required && !normalizeValue(value);

  // Check if value fails dataType validation
  const isDataTypeError = value && dataType && !isValueValid(value, dataType);

  // Generate error message: use custom error if provided, otherwise auto-generate
  let displayError = error;
  if (!displayError && isRequiredError) {
    displayError = getDefaultErrorMessage(dataType, true);
  } else if (!displayError && isDataTypeError) {
    displayError = getDefaultErrorMessage(dataType, false);
  }

  const hasError = Boolean(displayError);
  const shouldShowError = hasError && isTouched && !isFocused;

  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setIsFocused(true);
    externalOnFocus?.(e);
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setIsFocused(false);
    setInternalTouched(true);
    externalOnBlur?.(e);
  };

  return (
    <div
      className={mergeCss([
        'relative flex w-full flex-col gap-1 font-sans',
        className,
      ])}
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

      <div
        className={mergeCss([
          isParagraph
            ? 'relative flex w-full rounded-[20px] border bg-white px-5 py-3 transition-colors duration-200'
            : 'relative flex h-12 w-full items-center rounded-full border bg-white px-5 transition-colors duration-200',
          shouldShowError ? 'border-red-500' : 'border-gray-200',
          !shouldShowError && isActive && 'border-gray-500',
          !shouldShowError && 'focus-within:border-[#008CEE]',
          disabled && 'cursor-not-allowed opacity-50',
          containerClassName,
        ])}
      >
        {isParagraph ? (
          <textarea
            {...inputProps}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            rows={paragraphRows}
            value={value}
            disabled={disabled}
            required={required}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={shouldShowError ? true : undefined}
            aria-describedby={shouldShowError ? messageId : undefined}
            className={mergeCss([
              'min-h-[7.5rem] w-full resize-none border-none bg-transparent text-sm leading-6 text-gray-900 placeholder:text-gray-400 outline-none',
              inputClassName,
            ])}
          />
        ) : (
          <input
            {...inputProps}
            ref={ref as React.Ref<HTMLInputElement>}
            id={inputId}
            value={value}
            disabled={disabled}
            required={required}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={shouldShowError ? true : undefined}
            aria-describedby={shouldShowError ? messageId : undefined}
            className={mergeCss([
              'h-full w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none',
              inputClassName,
            ])}
          />
        )}

        {rightAdornment && !shouldShowError ? (
          <span className="ml-2 flex shrink-0 items-center text-gray-400">
            {rightAdornment}
          </span>
        ) : shouldShowError && showErrorIcon ? (
          <span className="ml-2 flex shrink-0 items-center text-red-500">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>

      {shouldShowError ? (
        <Text id={messageId} variant="caption" className="text-red-500">
          {displayError}
        </Text>
      ) : null}
    </div>
  );
});

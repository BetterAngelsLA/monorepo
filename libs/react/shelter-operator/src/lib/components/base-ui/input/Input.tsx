import { mergeCss } from '@monorepo/react/shared';
import { AlertCircle } from 'lucide-react';
import type {
  FocusEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { forwardRef, useId, useState } from 'react';
import { Label } from '../label';
import { Text } from '../text/text';
import type { InputDataType, InputProps } from './types';
import { normalizeUrlScheme } from './utils/normalizeUrlScheme';

const inputTypeByDataType: Partial<Record<InputDataType, string>> = {
  string: 'text',
  number: 'number',
  email: 'email',
  'phone-number': 'tel',
  time: 'time',
  date: 'date',
  url: 'url',
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
    isViewMode,
    rows,
    required = false,
    disabled = false,
    className,
    containerClassName,
    inputClassName,
    isActive = false,
    showErrorIcon = true,
    onFocus: externalOnFocus,
    onBlur: externalOnBlur,
    rightAdornment,
    value,
    ...inputProps
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const isViewEditMode = typeof isViewMode === 'boolean';
  const isParagraph = variant === 'paragraph';
  const paragraphRows = rows ?? 3;
  const inputType = (dataType && inputTypeByDataType[dataType]) ?? 'text';

  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  const shouldShowError = Boolean(error) && !isFocused;

  const handleFocus = (
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setIsFocused(true);
    externalOnFocus?.(e);
  };

  const handleBlur = (
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setIsFocused(false);

    // Auto-prepend https:// for url fields when no scheme is present
    if (dataType === 'url') {
      const url = normalizeUrlScheme(value as string);
      if (url && url !== value) {
        (inputProps.onChange as (e: { target: { value: string } }) => void)?.({
          target: { value: url },
        });
      }
    }

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
        <Label
          label={label}
          inputId={inputId}
          variant={isViewEditMode ? 'offset' : undefined}
          required={required}
        />
      )}

      <div
        className={mergeCss([
          isParagraph
            ? 'relative flex w-full rounded-[20px] border bg-white px-5 py-3 transition-colors duration-200'
            : 'relative flex h-12 w-full items-center rounded-full border bg-white px-5 transition-colors duration-200',
          isViewMode && 'border-transparent',
          !isViewMode && shouldShowError && 'border-red-500',
          !isViewMode && !shouldShowError && isActive && 'border-gray-500',
          !isViewMode &&
            !shouldShowError &&
            !isActive &&
            'border-gray-200 focus-within:border-[#008CEE]',
          !isViewMode && disabled && 'cursor-not-allowed opacity-50',
          containerClassName,
        ])}
      >
        {isParagraph ? (
          <textarea
            {...(inputProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            rows={paragraphRows}
            value={value}
            disabled={disabled || isViewMode}
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
            {...(inputProps as InputHTMLAttributes<HTMLInputElement>)}
            ref={ref as React.Ref<HTMLInputElement>}
            id={inputId}
            type={inputType}
            value={value}
            disabled={disabled || isViewMode}
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

      {shouldShowError && (
        <Text id={messageId} variant="caption" className="text-red-500">
          {error}
        </Text>
      )}
    </div>
  );
});

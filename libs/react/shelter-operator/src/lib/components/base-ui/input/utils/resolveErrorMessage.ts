import { Regex } from '@monorepo/react/shared';
import type { InputDataType } from '../types';

const validationPatterns: Record<InputDataType, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  'phone-number': /^[\d\s\-+()]*\d[\d\s\-+()]*$/,
  number: /^-?\d+(\.\d+)?$/,
  time: /^([01]\d|2[0-3]):([0-5]\d)$/,
  date: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
  url: Regex.url,
  string: /[\s\S]+/,
};

const dataTypeLabels: Partial<Record<InputDataType, string>> = {
  'phone-number': 'phone number',
  email: 'email',
  number: 'number',
  time: 'time',
  date: 'date',
  string: 'value',
  url: 'URL',
};

function normalizeValue(
  value: string | number | readonly string[] | undefined
): string {
  if (value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join('').trim();
  }

  return String(value).trim();
}

function isValidFormat(
  normalizedValue: string,
  dataType: InputDataType
): boolean {
  return validationPatterns[dataType].test(normalizedValue);
}

function formatErrorMessage(dataType: InputDataType): string {
  const label = dataTypeLabels[dataType] ?? dataType;
  return `Please enter a valid ${label}`;
}

type ResolveParams = {
  error?: string;
  required?: boolean;
  dataType?: InputDataType;
  value: string | number | readonly string[] | undefined;
};

/**
 * Returns the error message to display, or undefined if the field is valid.
 * Priority: explicit `error` prop > required check > format check.
 */
export function resolveErrorMessage(params: ResolveParams): string | undefined {
  const { error, required, dataType, value } = params;

  if (error) {
    return error;
  }

  const normalized = normalizeValue(value);

  if (required && !normalized) {
    return 'This field is required';
  }

  if (dataType && normalized && !isValidFormat(normalized, dataType)) {
    return formatErrorMessage(dataType);
  }

  return undefined;
}

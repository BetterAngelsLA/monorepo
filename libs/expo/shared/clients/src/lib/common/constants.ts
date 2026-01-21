export const CSRF_COOKIE_NAME = 'csrftoken';
export const CSRF_HEADER_NAME = 'x-csrftoken';

export const MODERN_BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const API_ERROR_CODES = {
  UNKNOWN: 'UNKNOWN',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

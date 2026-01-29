export const MODERN_BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// HTTP Header Names
export const HEADER_NAMES = {
  CONTENT_TYPE: 'Content-Type',
  COOKIE: 'Cookie',
  REFERER: 'Referer',
  USER_AGENT: 'User-Agent',
  ACCEPT: 'Accept',
  X_REQUESTED_WITH: 'X-Requested-With',
} as const;

// HTTP Header Values
export const HEADER_VALUES = {
  CONTENT_TYPE_JSON: 'application/json',
  ACCEPT_HTML: 'text/html',
  ACCEPT_JSON_ALL: 'application/json, text/plain, */*',
  X_REQUESTED_WITH_AJAX: 'XMLHttpRequest',
} as const;

// HTTP Methods that require CSRF protection
export const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

export const API_ERROR_CODES = {
  UNKNOWN: 'UNKNOWN',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

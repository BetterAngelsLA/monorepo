export const CSRF_COOKIE_NAME = 'csrftoken';
export const CSRF_HEADER_NAME = 'x-csrftoken';

export const API_ERROR_CODES = {
  UNKNOWN: 'UNKNOWN',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  HMIS_TOKEN_EXPIRED: 'HMIS_TOKEN_EXPIRED',
} as const;

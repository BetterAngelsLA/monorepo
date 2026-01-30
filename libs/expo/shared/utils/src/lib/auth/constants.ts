// HMIS constants
export const HMIS_AUTH_COOKIE_NAME = 'auth_token';
export const HMIS_API_URL_COOKIE_NAME = 'api_url';
export const HMIS_SERVER_DATE_TIME_COOKIE_NAME = 'server_date_time';
export const HMIS_TOKEN_HEADER_NAME = 'X-HMIS-Token';
export const HMIS_DIRECTIVE_NAME = 'hmisDirective';

// Cookies that should NOT be sent to backend (client-side only)
export const CLIENT_ONLY_COOKIES = [
  HMIS_AUTH_COOKIE_NAME, // Sent as header, not cookie
  HMIS_API_URL_COOKIE_NAME, // Client-side only
  HMIS_SERVER_DATE_TIME_COOKIE_NAME, // Client-side only
] as const;

// Cookie/CSRF constants
export const CSRF_COOKIE_NAME = 'csrftoken';
export const CSRF_HEADER_NAME = 'x-csrftoken';
export const SESSION_COOKIE_NAME = 'sessionid';

// Storage keys
export const AUTH_STORAGE_SCOPE_ID = 'auth-storage';
export const ENVIRONMENT_STORAGE_KEY = 'currentEnvironment';
export const NATIVE_COOKIE_ENCRYPTION_KEY_STORAGE =
  'native-cookie-encryption-key';
export const HMIS_API_URL_STORAGE_KEY = 'hmis_api_url';

export const CSRF_LOGIN_PATH = '/admin/login/';

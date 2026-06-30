/**
 * Shared default storage key for active organization ID.
 * Used by ``orgLink`` (Apollo link) and ``useActiveOrgState`` (React hook)
 * so they stay in sync without hard-coding the same string in multiple places.
 */
export const DEFAULT_ORG_STORAGE_KEY = 'betterangels_active_org_id';

// -- CSRF -----------------------------------------------------------------

/** Django CSRF cookie name. */
export const CSRF_COOKIE_NAME = 'csrftoken';

/** Django CSRF header name. */
export const CSRF_HEADER_NAME = 'x-csrftoken';

/** Django admin login path used to obtain a fresh CSRF token. */
export const CSRF_LOGIN_PATH = '/admin/login/';

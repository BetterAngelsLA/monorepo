/**
 * AsyncStorage keys for the direct-HMIS session.
 *
 * Kept out of `./hmisInterceptors` because that module's `.web.ts` twin is an
 * inert stub on web, which would hide them from the web callers that read them
 * through `interceptors.ts` and the package barrel.
 */
export const HMIS_API_URL_STORAGE_KEY = 'hmis_api_url';
export const HMIS_AUTH_DOMAIN_STORAGE_KEY = 'hmis_auth_domain';

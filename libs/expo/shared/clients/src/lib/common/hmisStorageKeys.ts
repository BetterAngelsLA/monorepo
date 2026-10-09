/**
 * AsyncStorage keys for the direct-HMIS session.
 *
 * Platform-neutral on purpose: both the native and the web build of
 * `./hmisInterceptors` need the same literal keys, and a web session that could
 * not read the pointers a native session wrote (or vice versa) would be a silent
 * data bug rather than a crash.
 */
export const HMIS_API_URL_STORAGE_KEY = 'hmis_api_url';
export const HMIS_AUTH_DOMAIN_STORAGE_KEY = 'hmis_auth_domain';

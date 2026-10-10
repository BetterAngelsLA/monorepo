/**
 * AsyncStorage keys for the direct-HMIS session.
 *
 * Split out of `./hmisInterceptors` — which has a `.web.ts` sibling — so the keys
 * stay resolvable on both platforms. On web that module resolves to an inert
 * stub, so anything living inside it is invisible there; these constants are read
 * through `interceptors.ts` (`clientHmis`) and through the package barrel
 * (`useClearLocalSession`, `getHmisAuthDomainHost`), on web as much as native.
 */
export const HMIS_API_URL_STORAGE_KEY = 'hmis_api_url';
export const HMIS_AUTH_DOMAIN_STORAGE_KEY = 'hmis_auth_domain';

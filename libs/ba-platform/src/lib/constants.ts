export const CSRF_COOKIE_NAME = 'csrftoken';
export const CSRF_HEADER_NAME = 'x-csrftoken';
export const CSRF_LOGIN_PATH = '/admin/login/';
export const DEFAULT_ORG_STORAGE_KEY = 'betterangels_active_org_id';

/** Default GraphQL endpoint path, appended to the API base URL. */
export const GRAPHQL_PATH = '/graphql';

/** Build the full GraphQL endpoint URL from a base API URL. */
export const getGraphqlUrl = (apiUrl: string) => `${apiUrl}${GRAPHQL_PATH}`;

/**
 * `/api1/*` base URLs per BA environment — each matches the HMIS instance the
 * user logged into (production → LA Clarity, demo → sandbox).
 *
 * NOTE: Clarity's `/api1/*` surface is served by the *web* host, not the
 * `api-*` host from the `api_url` cookie (verified against sandbox:
 * `/api1/clients/long` 404s on the api host).
 */
export const HMIS_PROD_BASE_URLS = {
  production: 'https://la.clarityhs.com',
  demo: 'https://betterangels-sandbox.clarityhs.com',
} as const;

export const HMIS_PROD_CLIENTS_LONG_PATH = '/api1/clients/long';

/**
 * Response field selection for the client search call — the `fields` value
 * sent to Clarity. Trimmed to what the client card renders; future client
 * calls (detail, edit, …) will define their own field sets.
 */
export const HMIS_PROD_CLIENT_SEARCH_FIELDS = [
  'age',
  'alias',
  'birth_date',
  'first_name',
  'fullName',
  'id',
  'last_name',
  'name_suffix',
  'unique_identifier',
].join(',');

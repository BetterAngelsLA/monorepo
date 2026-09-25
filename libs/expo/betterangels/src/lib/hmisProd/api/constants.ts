/**
 * HMIS (Clarity) web hosts — `/api1/*` is served by the web host, not the
 * `api-*` host from the `api_url` cookie (verified against sandbox:
 * `/api1/clients/long` 404s on the api host).
 */
export const HMIS_PROD_BASE_URLS = {
  production: 'https://la.clarityhs.com',
  sandbox: 'https://betterangels-sandbox.clarityhs.com',
} as const;

export const HMIS_PROD_CLIENTS_PATH = '/api1/clients';

export const HMIS_PROD_CLIENTS_LONG_PATH = `${HMIS_PROD_CLIENTS_PATH}/long`;

/**
 * Default response field selection for the client search call — joined into
 * Clarity's `fields` value by the client. Trimmed to what the client card
 * renders; callers can override it via the `fields` payload option.
 */
export const CLIENT_SEARCH_FIELDS_DEFAULT = [
  'age',
  'alias',
  'birth_date',
  'first_name',
  'fullName',
  'id',
  'last_name',
  'name_suffix',
  'unique_identifier',
];

/**
 * Default response field selection for the single-client call — joined into
 * Clarity's `fields` value by the client. Trimmed to what the Profile tab
 * renders today — extend it as more of the profile is wired up, or override
 * it via the `fields` payload option.
 *
 * Sub-fields (age, gender, race, veteran, name parts) are requested through
 * `screenValues.*` — Clarity nests them under a `screenValues` object in the
 * response (same convention the BA backend uses).
 */
export const CLIENT_DETAIL_FIELDS_DEFAULT = [
  'id',
  'personal_id',
  'unique_identifier',
  'alias',
  'first_name',
  'last_name',
  'birth_date',
  'dob_quality',
  'name_quality',
  'screenValues.age',
  'screenValues.gender',
  'screenValues.gender_identity_text',
  'screenValues.name_middle',
  'screenValues.name_suffix',
  'screenValues.race_ethnicity',
  'screenValues.additional_race_ethnicity_detail',
  'screenValues.veteran',
];

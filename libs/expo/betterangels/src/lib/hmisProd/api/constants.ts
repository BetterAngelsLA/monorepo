/**
 * Root of every React Query key owned by the direct-HMIS (hmisProd) feature.
 *
 * `useHmisProdSessionWatch` relies on this root to react to auth failures on
 * any feature query, so key factories must always build from it.
 */
export const HMIS_PROD_QUERY_KEY_ROOT = 'hmisProd';

/** Clarity answers unauthenticated web-style POSTs with its Yii CSRF guard. */
export const CSRF_MISMATCH_PATTERN = /csrf token mismatch/i;

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
 * Authenticated "who am I" probe served by the web host (like the rest of
 * `/api1/*`). Used by `useHmisProdSessionWatch` — Clarity answers `401` when
 * the stored HMIS token is missing or expired (verified against sandbox), so
 * a successful response means the session can still reach Clarity.
 */
export const HMIS_PROD_CURRENT_USER_PATH = '/api1/current-user';

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

export const DEFAULT_SEARCH_PAYLOAD = {
  expand: 'userCreated,userUpdated',
  page: 1,
  per_page: 50, // pagination not implemented, so setting this high
  sort: '-last_updated',
} as const;

/**
 * Default response field selection for the single-client call — joined into
 * Clarity's `fields` value by the client. Override it via the `fields`
 * payload option as more of the profile is wired up.
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

/**
 * Default query for the client history call (`GET /api1/clients/{id}/history`)
 * — mirrors the first page the Clarity web app requests: deleted entries
 * excluded. Overridable via `GetClientHistoryPayloadHmisProd`; pagination
 * isn't wired to the UI yet.
 */
export const CLIENT_HISTORY_DEFAULT_QUERY = {
  deleted: '0',
  page: '1',
  per_page: '50', // no pagination yet, so setting to large number for now.
} as const;

/**
 * Default response field selection for the client programs call — joined into
 * Clarity's `fields` value by the client. Mirrors the Clarity web app's
 * client-programs call except `groupAllProgramMembers.*` (household members),
 * which isn't surfaced yet — add it via the `fields` payload option when it
 * is.
 */
export const CLIENT_PROGRAMS_FIELDS_DEFAULT = [
  'agency.name',
  'agencySearch',
  'end_date',
  'homeAgency.name',
  'id',
  'private',
  'program.agency.name',
  'program.category.value_name',
  'program.name',
  'programSearch',
  'referralNotDeleted.activeOccupancy.bed.name',
  'referralNotDeleted.activeOccupancy.unit.name',
  'referralNotDeleted.agency.name',
  'referralNotDeleted.date',
  'referralNotDeleted.endDate',
  'referralNotDeleted.id',
  'referralNotDeleted.is_upcoming',
  'referralNotDeleted.status',
  'referralNotDeleted.user.first_name',
  'referralNotDeleted.user.last_name',
  'start_date',
  'type',
  'user.agency.name',
  'user.first_name',
  'user.last_name',
];

/**
 * Default query for the client programs call
 * (`GET /api1/clients/{id}/client-programs`) — mirrors the request the Clarity
 * web app makes for a client's programs: newest first, deleted entries
 * excluded. Overridable via `GetClientProgramsPayloadHmisProd`; pagination
 * isn't wired to the UI yet.
 */
export const CLIENT_PROGRAMS_DEFAULT_QUERY = {
  deleted: '0',
  sort: '-start_date',
  page: '1',
  per_page: '50', // no pagination yet, so setting to large number for now.
} as const;

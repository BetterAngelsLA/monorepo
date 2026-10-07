import { HMIS_PROD_BASE_URLS } from './constants';

export type HmisProdBaseUrlKey = keyof typeof HMIS_PROD_BASE_URLS;

export interface SearchClientsPayloadHmisProd {
  search: string;
  expand?: string;
  page?: number;
  per_page?: number | string;
  sort?: string;
  /** Overrides `CLIENT_SEARCH_FIELDS_DEFAULT`*/
  fields?: string[];
}

export interface GetClientPayloadHmisProd {
  /** Overrides `CLIENT_DETAIL_FIELDS_DEFAULT` */
  fields?: string[];
}

/**
 * Query values for the client history call — strings, since they go straight
 * into the query string. Defaults live in `CLIENT_HISTORY_DEFAULT_QUERY`.
 */
export interface GetClientHistoryPayloadHmisProd {
  /** Include deleted entries (`'0'` = exclude, the default). */
  deleted?: string;
  /** Page number (default `'1'`). */
  page?: string;
  /** Items per page. */
  per_page?: string;
}

/**
 * Query values for the client programs call — strings, since they go straight
 * into the query string. Defaults live in `CLIENT_PROGRAMS_DEFAULT_QUERY`.
 */
export interface GetClientProgramsPayloadHmisProd {
  /** Include deleted entries (`'0'` = exclude, the default). */
  deleted?: string;
  /** Sort expression (default `'-start_date'` — newest first). */
  sort?: string;
  /** Page number (default `'1'`). */
  page?: string;
  /** Items per page. */
  per_page?: string;
  /** Overrides `CLIENT_PROGRAMS_FIELDS_DEFAULT`. */
  fields?: string[];
}

/**
 * Client search result item — keys mirror the requested `fields` (snake_case).
 */
export interface HmisProdClientSearchItem {
  id: number | string;
  first_name?: string | null;
  last_name?: string | null;
  fullName?: string | null;
  alias?: string | null;
  birth_date?: string | null;
  age?: number | null;
  name_suffix?: string | null;
  unique_identifier?: string | null;
}

/** Pagination envelope Clarity sends with list responses (`_meta`). */
export interface HmisProdPaginationMeta {
  current_page?: number;
  per_page?: number;
  total_count?: number;
  page_count?: number;
}

export interface SearchClientsResponseHmisProd {
  items: HmisProdClientSearchItem[];
  _meta?: HmisProdPaginationMeta;
  _links?: Record<string, unknown>;
}

/** Fields the History tab renders from a history entry's `data` object. */
export interface HmisProdHistoryItemData {
  name?: string | null;
  agency?: string | null;
  agency_message?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  added_date?: string | null;
}

/**
 * Single client history entry — `type` is the entry kind (`demographic`,
 * `service`, `program`, …); `data` carries the fields the History tab needs
 * (Clarity includes more per type, which we ignore for now).
 */
export interface HmisProdClientHistoryItem {
  id: number | string;
  type: string;
  data: HmisProdHistoryItemData;
}

/**
 * Response from `GET /api1/clients/{id}/history` — `items` is the flat list
 * across all entry types (`source` repeats it grouped by type; unused).
 */
export interface GetClientHistoryResponseHmisProd {
  items: HmisProdClientHistoryItem[];
  _meta?: HmisProdPaginationMeta;
  _links?: Record<string, unknown>;
}

/** Name-only reference Clarity nests for dot-path fields (`agency.name`). */
export interface HmisProdNameRef {
  name?: string | null;
}

/**
 * `program.category` — Clarity exposes the program category as its
 * `value_name`.
 */
export interface HmisProdClientProgramCategory {
  value_name?: string | null;
}

/** `program` block of a client program entry. */
export interface HmisProdClientProgramInfo {
  name?: string | null;
  agency?: HmisProdNameRef | null;
  category?: HmisProdClientProgramCategory | null;
}

/** Person name fields (`first_name` / `last_name`). */
export interface HmisProdPersonName {
  first_name?: string | null;
  last_name?: string | null;
}

/** `user` block — the staff member the enrollment is attributed to. */
export interface HmisProdClientProgramUser extends HmisProdPersonName {
  agency?: HmisProdNameRef | null;
}

/** `referralNotDeleted.activeOccupancy` (unit/bed names only for now). */
export interface HmisProdReferralActiveOccupancy {
  bed?: HmisProdNameRef | null;
  unit?: HmisProdNameRef | null;
}

/**
 * `referralNotDeleted` — the enrollment's (non-deleted) referral; `null` when
 * the enrollment has none (e.g. walk-ins).
 */
export interface HmisProdClientProgramReferral {
  id?: number | string | null;
  date?: string | null;
  endDate?: string | null;
  is_upcoming?: number | boolean | null;
  status?: number | string | null;
  agency?: HmisProdNameRef | null;
  activeOccupancy?: HmisProdReferralActiveOccupancy | null;
  user?: HmisProdPersonName | null;
}

/**
 * Single client program entry from `GET /api1/clients/{id}/client-programs`
 * — keys mirror the requested `fields` (snake_case).
 */
export interface HmisProdClientProgramItem {
  id: number | string;
  start_date?: string | null;
  end_date?: string | null;
  type?: number | null;
  private?: number | null;
  program?: HmisProdClientProgramInfo | null;
  user?: HmisProdClientProgramUser | null;
  agency?: HmisProdNameRef | null;
  homeAgency?: HmisProdNameRef | null;
  referralNotDeleted?: HmisProdClientProgramReferral | null;
}

/**
 * Response from `GET /api1/clients/{id}/client-programs` — `items` is the
 * client's program enrollments.
 */
export interface GetClientProgramsResponseHmisProd {
  items: HmisProdClientProgramItem[];
  _meta?: HmisProdPaginationMeta;
  _links?: Record<string, unknown>;
}

/**
 * Sub-fields requested via `screenValues.*` — Clarity nests them under a
 * `screenValues` object in the detail response.
 *
 * Enum-ish values (`gender`, `race_ethnicity`, `veteran`, `name_suffix`) come
 * back as the ordinal codes from the HMIS data model, not labels — see
 * `enumOrdinalMapsHmisProd` in the adapters.
 */
export interface HmisProdClientScreenValues {
  age?: number | null;
  gender?: number[] | null;
  gender_identity_text?: string | null;
  name_middle?: string | null;
  name_suffix?: number | null;
  race_ethnicity?: number[] | null;
  additional_race_ethnicity_detail?: string | null;
  veteran?: number | null;
}

/**
 * Single client payload from Clarity's client endpoint
 * (`GET /api1/clients/{id}`) — keys mirror the requested `fields`
 * (snake_case).
 *
 * Sub-fields are read from `screenValues` first, but a few can also land
 * top-level (e.g. `gender`), so both are typed here; the adapter checks both.
 */
export interface HmisProdClientDetail {
  id: number | string;
  personal_id?: string | null;
  unique_identifier?: string | null;
  alias?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  dob_quality?: number | null;
  name_quality?: number | null;
  age?: number | null;
  gender?: number[] | null;
  gender_identity_text?: string | null;
  name_middle?: string | null;
  name_suffix?: number | null;
  race_ethnicity?: number[] | null;
  additional_race_ethnicity_detail?: string | null;
  veteran?: number | null;
  screenValues?: HmisProdClientScreenValues | null;
}

/**
 * Request context captured before the request — the debug payload fields
 * known up front; request-level failures (no HTTP response) also carry it.
 */
export interface HmisProdRequestContext {
  /** Full URL the request was sent to. */
  url: string;
  /** Whether an HMIS `Authorization` token was attached to the request. */
  hasAuthToken: boolean;
  /**
   * Host the HMIS token was read from (`hmis_auth_domain`); `null` if unknown.
   */
  authDomain: string | null;
}

/**
 * Debug payload captured for every request — full URL, status, auth context
 * and the raw response body (success or error alike, unparsed). Copied from
 * the debug UI (`FeatureFlags.HMIS_PROD_DEMO_DEBUG_MODE`) and untangled
 * manually.
 */
export interface HmisProdRequestDebugInfo extends HmisProdRequestContext {
  /** HTTP status of the response; absent when no response was received. */
  status?: number;
  /** Raw response body text; `null` when no response was received. */
  response: string | null;
  /** Failure message when the request never received an HTTP response. */
  requestError?: string;
}

/** Client method result — parsed `data` plus its raw debug payload. */
export interface HmisProdRequestResult<T> {
  data: T;
  debugInfo: HmisProdRequestDebugInfo;
}

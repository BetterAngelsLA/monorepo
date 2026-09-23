import { HMIS_PROD_BASE_URLS } from './constants';

export type HmisProdBaseUrlKey = keyof typeof HMIS_PROD_BASE_URLS;

export interface SearchClientsPayloadHmisProd {
  search: string;
  expand?: string;
  page?: number;
  per_page?: number | string;
  sort?: string;
  fields?: string;
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

export interface SearchClientsResponseHmisProd {
  items: HmisProdClientSearchItem[];
  _meta?: {
    current_page?: number;
    per_page?: number;
    total_count?: number;
    page_count?: number;
  };
  _links?: Record<string, unknown>;
}

/**
 * Debug payload captured for every request — full URL and the raw response
 * body (success or error alike, unparsed). Copied from the debug UI
 * (`FeatureFlags.HMIS_PROD_DEMO_DEBUG_MODE`) and untangled manually.
 */
export interface HmisProdRequestDebugInfo {
  /** Full URL the request was sent to. */
  url: string;
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

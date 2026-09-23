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
 * Loose until we confirm the exact payload shape in the app.
 */
export interface HmisProdClientSearchItem {
  id: number | string;
  [key: string]: unknown;
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

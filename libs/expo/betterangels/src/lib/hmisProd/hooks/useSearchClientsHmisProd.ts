import { useEnvironment } from '@monorepo/ba-platform';
import { useDebounce } from '@monorepo/react/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  createClientHmisProd,
  HMIS_PROD_BASE_URLS,
  type HmisProdBaseUrlKey,
  type SearchClientsResponseHmisProd,
} from '../api';

const SEARCH_DEBOUNCE_MS = 300;

export const getSearchClientsHmisProdQueryKey = (
  baseUrl: string,
  search: string,
) => ['hmisProd', 'searchClients', baseUrl, search] as const;

const isHmisProdBaseUrlKey = (value: string): value is HmisProdBaseUrlKey =>
  value in HMIS_PROD_BASE_URLS;

/**
 * Map the BA environment to the matching HMIS host. Unknown values fall back
 * to sandbox so we never accidentally hit LA prod.
 */
const resolveHmisProdBaseUrl = (environment: string): string =>
  HMIS_PROD_BASE_URLS[isHmisProdBaseUrlKey(environment) ? environment : 'demo'];

/**
 * Search clients directly against HMIS (Clarity `/api1/clients/long`).
 *
 * - Debounces the search term (300 ms).
 * - Disabled while the term is empty (avoids a full-table query).
 * - Picks the HMIS host from the current BA environment — sandbox for `demo`,
 *   LA Clarity for `production` — matching the instance the logged-in user's
 *   `auth_token` belongs to.
 */
export function useSearchClientsHmisProd(search: string) {
  const { environment } = useEnvironment();
  const baseUrl = resolveHmisProdBaseUrl(environment);
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);

  const client = useMemo(() => createClientHmisProd(baseUrl), [baseUrl]);

  return useQuery<SearchClientsResponseHmisProd>({
    queryKey: getSearchClientsHmisProdQueryKey(baseUrl, debouncedSearch),
    queryFn: () => client.searchClients({ search: debouncedSearch }),
    enabled: debouncedSearch.length > 1,
  });
}

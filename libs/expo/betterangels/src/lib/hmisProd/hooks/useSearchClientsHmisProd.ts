import { useApiConfig } from '@monorepo/ba-platform';
import { useDebounce } from '@monorepo/react/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  createClientHmisProd,
  ErrorHmisProd,
  resolveHmisProdBaseUrl,
  type HmisProdRequestDebugInfo,
} from '../api';

const SEARCH_DEBOUNCE_MS = 200;

export const getSearchClientsHmisProdQueryKey = (
  baseUrl: string,
  search: string,
) => ['hmisProd', 'searchClients', baseUrl, search] as const;

/**
 * Search clients directly against HMIS (Clarity `/api1/clients/long`).
 *
 * - Debounces the search term (200 ms).
 * - Disabled until the term is at least 2 characters.
 * - Picks the HMIS host from the BA backend the app is actually talking to
 *   (`useApiConfig().apiUrl`) — local and dev backends authenticate against
 *   the sandbox HMIS, only the prod backend uses LA Clarity. This matches the
 *   instance the logged-in user's `auth_token` belongs to; see
 *   `resolveHmisProdBaseUrl`.
 *
 * Returns the query result with `data` unwrapped to the parsed response, plus
 * `debugInfo` (full URL + raw response body) for the latest result or error —
 * used by the debug copy button; `null` until there is something to report.
 */
export function useSearchClientsHmisProd(search: string) {
  const { apiUrl: baEnvApiUrl } = useApiConfig();
  const baseUrl = resolveHmisProdBaseUrl(baEnvApiUrl);
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);

  const client = useMemo(() => createClientHmisProd(baseUrl), [baseUrl]);

  const query = useQuery({
    queryKey: getSearchClientsHmisProdQueryKey(baseUrl, debouncedSearch),
    queryFn: () =>
      client.searchClients({
        search: debouncedSearch,
      }),
    enabled: debouncedSearch.length > 1,
  });

  // Prefer the error payload over any stale success data, so a failed
  // request is what the debug button offers to copy.
  const errorDebugInfo =
    query.error instanceof ErrorHmisProd ? query.error.debugInfo : null;

  const debugInfo: HmisProdRequestDebugInfo | null =
    errorDebugInfo ?? query.data?.debugInfo ?? null;

  return {
    ...query,
    data: query.data?.data,
    debugInfo,
  };
}

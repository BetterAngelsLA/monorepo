import { useApiConfig } from '@monorepo/ba-platform';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  createClientHmisProd,
  ErrorHmisProd,
  resolveHmisProdBaseUrl,
  type HmisProdRequestDebugInfo,
} from '../api';

export const getClientHmisProdQueryKey = (baseUrl: string, id: string) =>
  ['hmisProd', 'client', baseUrl, id] as const;

/**
 * Fetch a single HMIS client directly against Clarity
 * (`GET /api1/clients/{id}`).
 *
 * Same conventions as `useSearchClientsHmisProd`:
 *
 * - Picks the HMIS host from the BA backend the app is actually talking to
 *   (`useApiConfig().apiUrl`); see `resolveHmisProdBaseUrl`.
 * - No retries — failures here are deterministic (missing/expired HMIS
 *   session, missing client) and retrying only repeats failed requests.
 * - Returns the query result with `data` unwrapped to the parsed client, plus
 *   `debugInfo` (full URL, status, auth context and raw response body) for
 *   the debug copy button.
 */
export function useClientHmisProd(id: string) {
  const { apiUrl: baEnvApiUrl } = useApiConfig();
  const baseUrl = resolveHmisProdBaseUrl(baEnvApiUrl);

  const apiClient = useMemo(() => createClientHmisProd(baseUrl), [baseUrl]);

  const query = useQuery({
    queryKey: getClientHmisProdQueryKey(baseUrl, id),
    queryFn: () => apiClient.getClient(id),
    enabled: !!id,
    retry: false,
  });

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

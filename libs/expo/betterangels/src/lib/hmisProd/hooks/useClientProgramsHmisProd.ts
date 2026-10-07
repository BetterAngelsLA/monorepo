import { useApiConfig } from '@monorepo/ba-platform';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  createApiClientHmisProd,
  ErrorHmisProd,
  HMIS_PROD_QUERY_KEY_ROOT,
  resolveHmisProdBaseUrl,
  type HmisProdRequestDebugInfo,
} from '../api';

export const getClientProgramsHmisProdQueryKey = (
  baseUrl: string,
  id: string,
) => [HMIS_PROD_QUERY_KEY_ROOT, 'clientPrograms', baseUrl, id] as const;

/**
 * Fetch a client's program enrollments directly against Clarity
 * (`GET /api1/clients/{id}/client-programs`).
 *
 * Same conventions as `useClientHistoryHmisProd`:
 *
 * - Picks the HMIS host from the BA backend the app is actually talking to
 *   (`useApiConfig().apiUrl`); see `resolveHmisProdBaseUrl`.
 * - No retries — failures here are deterministic (missing/expired HMIS
 *   session, missing client) and retrying only repeats failed requests.
 * - Returns the query result with `data` unwrapped to the parsed response,
 *   plus `debugInfo` (full URL, status, auth context and raw response body)
 *   for the debug copy button.
 */
export function useClientProgramsHmisProd(id: string) {
  const { apiUrl: baEnvApiUrl } = useApiConfig();
  const baseUrl = resolveHmisProdBaseUrl(baEnvApiUrl);

  const apiClient = useMemo(() => createApiClientHmisProd(baseUrl), [baseUrl]);

  const query = useQuery({
    queryKey: getClientProgramsHmisProdQueryKey(baseUrl, id),
    queryFn: () => apiClient.getClientPrograms(id),
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

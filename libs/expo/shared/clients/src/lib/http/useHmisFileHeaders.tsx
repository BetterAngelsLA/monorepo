import { useQuery } from '@tanstack/react-query';
import { loadHmisFileHeaders } from '../common/interceptors';

export interface HmisFileHeadersValue {
  headers: Record<string, string> | null;
  baseUrl: string | null;
}

const HMIS_FILE_HEADERS_QUERY_KEY = ['hmisFileHeaders'] as const;

/**
 * Loads HMIS file headers and base URL via React Query (cached).
 * Use with Avatar/image components and HMIS file screens that need authenticated HMIS file requests.
 * Must be used inside QueryClientProvider.
 */
export function useHmisFileHeaders(): HmisFileHeadersValue {
  const { data } = useQuery({
    queryKey: HMIS_FILE_HEADERS_QUERY_KEY,
    queryFn: loadHmisFileHeaders,
    staleTime: Infinity,
  });

  return {
    headers: data?.headers ?? null,
    baseUrl: data?.baseUrl ?? null,
  };
}

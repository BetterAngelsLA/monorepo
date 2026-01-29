import type { FileName } from '@monorepo/expo/shared/clients';
import { hmisClient } from '@monorepo/expo/shared/clients';
import { useQuery } from '@tanstack/react-query';

const QUERY_KEY = ['hmis', 'fileNames'] as const;
const STALE_TIME_MS = 60 * 60 * 1000; // 60 minutes

export function useHmisFileNames() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: (): Promise<FileName[]> => hmisClient.getAllFileNames(),
    staleTime: STALE_TIME_MS,
  });
}

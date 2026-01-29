import type { FileName } from '@monorepo/expo/shared/clients';
import { useQuery } from '@tanstack/react-query';
import { useHmisClient } from '../useHmisClient';

const QUERY_KEY = ['hmis', 'fileNames'] as const;
const STALE_TIME_MS = 60 * 60 * 1000; // 60 minutes

export function useHmisFileNames() {
  const { getAllFileNames } = useHmisClient();

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: (): Promise<FileName[]> => getAllFileNames(),
    staleTime: STALE_TIME_MS,
  });
}

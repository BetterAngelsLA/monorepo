import { useQuery } from '@tanstack/react-query';
import { useHmisClient } from '../useHmisClient';
import { fetchAllPages } from './fetchAllPages';

const QUERY_KEY = ['hmis', 'fileNames'] as const;
const STALE_TIME_MS = 60 * 60 * 1000; // 60 minutes
const PER_PAGE = 50;

export function useHmisFileNames() {
  const { getFileNames } = useHmisClient();

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      fetchAllPages((page) => getFileNames({ per_page: PER_PAGE, page })),
    staleTime: STALE_TIME_MS,
  });
}

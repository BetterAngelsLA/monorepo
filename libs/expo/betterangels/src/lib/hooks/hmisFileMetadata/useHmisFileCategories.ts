import type { FileCategory } from '@monorepo/expo/shared/clients';
import { useHmisClient } from '../useHmisClient';
import { useQuery } from '@tanstack/react-query';

const QUERY_KEY = ['hmis', 'fileCategories'] as const;
const STALE_TIME_MS = 60 * 60 * 1000; // 60 minutes

export function useHmisFileCategories() {
  const { getFileCategories } = useHmisClient();

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<FileCategory[]> => {
      const res = await getFileCategories();
      return res.items ?? [];
    },
    staleTime: STALE_TIME_MS,
  });
}

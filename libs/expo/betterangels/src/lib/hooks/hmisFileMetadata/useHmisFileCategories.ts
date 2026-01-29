import type { FileCategory } from '@monorepo/expo/shared/clients';
import { hmisClient } from '@monorepo/expo/shared/clients';
import { useQuery } from '@tanstack/react-query';

const QUERY_KEY = ['hmis', 'fileCategories'] as const;
const STALE_TIME_MS = 60 * 60 * 1000; // 60 minutes

export function useHmisFileCategories() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<FileCategory[]> => {
      const res = await hmisClient.getFileCategories();
      return res.items ?? [];
    },
    staleTime: STALE_TIME_MS,
  });
}

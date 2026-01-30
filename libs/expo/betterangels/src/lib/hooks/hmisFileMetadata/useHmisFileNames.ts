import type { FileName } from '@monorepo/expo/shared/clients';
import { useQuery } from '@tanstack/react-query';
import { useHmisClient } from '../useHmisClient';

const QUERY_KEY = ['hmis', 'fileNames'] as const;
const STALE_TIME_MS = 60 * 60 * 1000; // 60 minutes
const PER_PAGE = 50;

async function fetchAllFileNames(
  getFileNames: (params: { per_page: number; page: number }) => Promise<{
    items?: FileName[] | null;
    _meta?: { current_page: number; page_count: number };
  }>
): Promise<FileName[]> {
  const all: FileName[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await getFileNames({ per_page: PER_PAGE, page });
    all.push(...(res.items ?? []));
    const meta = res._meta;
    hasMore =
      !!meta &&
      meta.current_page < meta.page_count &&
      (res.items?.length ?? 0) === PER_PAGE;
    page += 1;
  }

  return all;
}

export function useHmisFileNames() {
  const { getFileNames } = useHmisClient();

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: (): Promise<FileName[]> => fetchAllFileNames(getFileNames),
    staleTime: STALE_TIME_MS,
  });
}

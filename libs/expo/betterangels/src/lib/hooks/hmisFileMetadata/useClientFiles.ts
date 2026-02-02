import type { ClientFile } from '@monorepo/expo/shared/clients';
import { useQuery } from '@tanstack/react-query';
import { useHmisClient } from '../useHmisClient';
import { fetchAllPages } from './fetchAllPages';

const PER_PAGE = 50;
const CLIENT_FILE_FIELDS =
  'id,ref_category,ref_file_name,ref_agency,name,is_program_file,file.id,file.added_date,file.filename,file.filesize,category,fileName';

export const getClientFilesQueryKey = (clientId?: string, hmisId?: string) => [
  'hmis',
  'clientFiles',
  clientId,
  hmisId,
];

export function useClientFiles(clientId?: string, hmisId?: string) {
  const { getClientFiles } = useHmisClient();

  const isEnabled = !!clientId && !!hmisId;

  return useQuery({
    queryKey: getClientFilesQueryKey(clientId, hmisId),
    queryFn: async (): Promise<ClientFile[]> => {
      if (!hmisId) return [];

      return fetchAllPages((page) =>
        getClientFiles(hmisId, {
          page,
          per_page: PER_PAGE,
          fields: CLIENT_FILE_FIELDS,
        })
      );
    },
    enabled: isEnabled,
  });
}

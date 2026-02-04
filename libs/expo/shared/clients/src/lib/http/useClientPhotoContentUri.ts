import { getClientPhotoUrls } from './hmisClient';
import { useHmisFileHeaders } from './useHmisFileHeaders';

/**
 * Hook that returns the content URI and headers for a client's profile photo.
 * Use with Avatar or image components that need authenticated HMIS file requests.
 */
export function useClientPhotoContentUri(hmisId: string | number | null | undefined) {
  const { headers, baseUrl } = useHmisFileHeaders();

  const contentUri =
    baseUrl && headers && hmisId != null
      ? getClientPhotoUrls(baseUrl, hmisId).content
      : null;

  return { contentUri, headers };
}

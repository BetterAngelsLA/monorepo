import { useHmisFileHeaders } from './HmisFileHeadersContext';

/**
 * Hook that returns the content URI and headers for a client's profile photo.
 * Use with Avatar or image components that need authenticated HMIS file requests.
 * Must be used inside QueryClientProvider.
 */
export function useClientPhotoContentUri(
  clientId: string | number | null | undefined
) {
  const { headers, baseUrl } = useHmisFileHeaders();

  if (!clientId) {
    return { contentUri: null, thumbnailUri: null, headers: null };
  }

  const thumbnailUri = `${baseUrl}/clients/${clientId}/photo/thumb`;
  const contentUri = `${baseUrl}/clients/${clientId}/photo`;

  return { contentUri, thumbnailUri, headers };
}

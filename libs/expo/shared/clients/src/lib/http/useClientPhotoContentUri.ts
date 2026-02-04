import { useHmisFileHeadersContext } from './HmisFileHeadersContext';

/**
 * Hook that returns the content URI and headers for a client's profile photo.
 * Use with Avatar or image components that need authenticated HMIS file requests.
 * Must be used inside HmisFileHeadersProvider.
 */
export function useClientPhotoContentUri(
  clientId: string | number | null | undefined
) {
  const context = useHmisFileHeadersContext();
  const headers = context?.headers ?? null;
  const baseUrl = context?.baseUrl ?? null;

  if (!clientId) {
    return { contentUri: null, thumbnailUri: null, headers: null };
  }

  const thumbnailUri = `${baseUrl}/clients/${clientId}/photo/thumb`;
  const contentUri = `${baseUrl}/clients/${clientId}/photo`;

  return { contentUri, thumbnailUri, headers };
}

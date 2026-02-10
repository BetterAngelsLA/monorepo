import { useClientPhotoVersion } from './useClientPhotoVersion';
import { useHmisFileHeaders } from './useHmisFileHeaders';

export function useClientPhotoContentUri(
  clientId: string | number | null | undefined
) {
  const { headers, baseUrl } = useHmisFileHeaders();

  const version = useClientPhotoVersion(clientId);
  if (!clientId) {
    return { contentUri: null, thumbnailUri: null, headers: null };
  }
  const cacheBuster = version > 0 ? `?t=${version}` : '';

  const thumbnailUri = `${baseUrl}/clients/${clientId}/photo/thumb${cacheBuster}`;
  const contentUri = `${baseUrl}/clients/${clientId}/photo${cacheBuster}`;

  return { contentUri, thumbnailUri, headers };
}

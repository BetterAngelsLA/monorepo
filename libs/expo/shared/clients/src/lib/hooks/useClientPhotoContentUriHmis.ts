import { useClientPhotoVersionHmis } from './useClientPhotoVersionHmis';
import { useFileHeadersHmis } from './useFileHeadersHmis';

export function useClientPhotoContentUriHmis(
  clientId: string | number | null | undefined
) {
  const { headers, baseUrl } = useFileHeadersHmis();

  const version = useClientPhotoVersionHmis(clientId);
  if (!clientId) {
    return { contentUri: null, thumbnailUri: null, headers: null };
  }
  const cacheBuster = version > 0 ? `?t=${version}` : '';

  const thumbnailUri = `${baseUrl}/clients/${clientId}/photo/thumb${cacheBuster}`;
  const contentUri = `${baseUrl}/clients/${clientId}/photo${cacheBuster}`;

  return { contentUri, thumbnailUri, headers };
}

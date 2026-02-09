import { useEffect, useState } from 'react';
import {
  getClientPhotoVersion,
  subscribeClientPhotoVersion,
} from './clientPhotoVersionStore';
import { useHmisFileHeaders } from './useHmisFileHeaders';

/**
 * Hook that returns the content URI and headers for a client's profile photo.
 * Use with Avatar or image components that need authenticated HMIS file requests.
 * Must be used inside QueryClientProvider.
 *
 * After a photo upload, call incrementClientPhotoVersion(clientId) so the returned
 * URL includes a cache-busting query param and all views show the new image.
 */
export function useClientPhotoContentUri(
  clientId: string | number | null | undefined
) {
  const { headers, baseUrl } = useHmisFileHeaders();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!clientId) {
      return;
    }
    return subscribeClientPhotoVersion((updatedId) => {
      if (updatedId === clientId) setTick((n) => n + 1);
    });
  }, [clientId]);

  if (!clientId) {
    return { contentUri: null, thumbnailUri: null, headers: null };
  }

  const version = getClientPhotoVersion(clientId);
  const cacheBuster = version > 0 ? `?t=${version}` : '';

  const thumbnailUri = `${baseUrl}/clients/${clientId}/photo/thumb${cacheBuster}`;
  const contentUri = `${baseUrl}/clients/${clientId}/photo${cacheBuster}`;

  return { contentUri, thumbnailUri, headers };
}

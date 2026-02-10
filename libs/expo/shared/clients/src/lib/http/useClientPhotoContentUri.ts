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
 * URL includes ?t=<token> and all views (list cards, profile header, modals) show
 * the new image.
 */
export function useClientPhotoContentUri(
  clientId: string | number | null | undefined
) {
  const { headers, baseUrl } = useHmisFileHeaders();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!clientId) return;
    return subscribeClientPhotoVersion((updatedId) => {
      if (updatedId === String(clientId)) setTick((n) => n + 1);
    });
  }, [clientId]);

  if (!clientId) {
    return { contentUri: null, thumbnailUri: null, headers: null };
  }

  const token = getClientPhotoVersion(clientId);
  const cacheBuster = token > 0 ? `?t=${token}` : '';
  const thumbnailUri = `${baseUrl}/clients/${clientId}/photo/thumb${cacheBuster}`;
  const contentUri = `${baseUrl}/clients/${clientId}/photo${cacheBuster}`;

  return { contentUri, thumbnailUri, headers };
}

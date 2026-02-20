import { createPlacesClient, TPlacesClient } from '@monorepo/shared/places';
import { useMemo } from 'react';
import { useApiConfig } from '../providers';

export function usePlacesClient(): TPlacesClient {
  const { fetchClient } = useApiConfig();

  return useMemo(() => createPlacesClient(fetchClient), [fetchClient]);
}

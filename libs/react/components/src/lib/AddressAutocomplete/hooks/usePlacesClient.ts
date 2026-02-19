import { useApiConfig } from '@monorepo/react/shared';
import { createPlacesClient, TPlacesClient } from '@monorepo/shared/places';
import { useMemo } from 'react';

export function usePlacesClient(): TPlacesClient {
  const { fetchClient } = useApiConfig();
  return useMemo(() => createPlacesClient(fetchClient), [fetchClient]);
}

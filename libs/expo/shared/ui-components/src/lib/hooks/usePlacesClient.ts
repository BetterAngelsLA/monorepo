import { useApiConfig } from '@monorepo/expo/shared/clients';
import { createPlacesClient, TPlacesClient } from '@monorepo/shared/places';
import { useMemo } from 'react';

/**
 * Hook that creates a places client wired to the current API config.
 * Returns methods for autocomplete, place details, and reverse geocoding
 * without needing to pass fetchClient to each call.
 */
export function usePlacesClient(): TPlacesClient {
  const { fetchClient } = useApiConfig();
  return useMemo(() => createPlacesClient(fetchClient), [fetchClient]);
}

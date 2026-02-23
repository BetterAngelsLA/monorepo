import { GooglePlacesClient } from '@monorepo/shared/places';
import { createContext, ReactNode, useContext, useMemo } from 'react';

const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';

const GooglePlacesContext = createContext<GooglePlacesClient | null>(null);

export function GooglePlacesProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () => new GooglePlacesClient(GOOGLE_PLACES_API_KEY),
    []
  );

  return (
    <GooglePlacesContext.Provider value={client}>
      {children}
    </GooglePlacesContext.Provider>
  );
}

export function useGooglePlaces(): GooglePlacesClient {
  const client = useContext(GooglePlacesContext);
  if (!client) {
    throw new Error(
      'useGooglePlaces must be used within a <GooglePlacesProvider>'
    );
  }
  return client;
}

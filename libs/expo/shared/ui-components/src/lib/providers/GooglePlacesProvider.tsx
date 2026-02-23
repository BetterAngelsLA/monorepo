import { GooglePlacesClient, TPlatformHeaders } from '@monorepo/shared/places';
import { createContext, ReactNode, useContext, useMemo } from 'react';

const GooglePlacesContext = createContext<GooglePlacesClient | null>(null);

type GooglePlacesProviderProps = {
  apiKey: string;
  children: ReactNode;
  platformHeaders?: TPlatformHeaders;
};

export function GooglePlacesProvider({
  apiKey,
  children,
  platformHeaders,
}: GooglePlacesProviderProps) {
  const client = useMemo(
    () => new GooglePlacesClient(apiKey, platformHeaders),
    [apiKey, platformHeaders]
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

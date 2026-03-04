import { GooglePlacesClient, TPlatformHeaders } from '@monorepo/shared/places';
import { getSigningFingerprint } from '@monorepo/signing-fingerprint';
import * as Application from 'expo-application';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { Platform } from 'react-native';

const platformHeaders: TPlatformHeaders =
  Platform.OS === 'ios'
    ? { iosBundleId: Application.applicationId ?? undefined }
    : {
        androidPackage: Application.applicationId ?? undefined,
        androidCertFingerprint: getSigningFingerprint() ?? undefined,
      };

const GooglePlacesContext = createContext<GooglePlacesClient | null>(null);

type GooglePlacesProviderProps = {
  apiKey: string;
  children: ReactNode;
};

export function GooglePlacesProvider({
  apiKey,
  children,
}: GooglePlacesProviderProps) {
  const client = useMemo(
    () => new GooglePlacesClient(apiKey, platformHeaders),
    [apiKey]
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

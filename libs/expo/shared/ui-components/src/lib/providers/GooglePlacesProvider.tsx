import { GooglePlacesClient, TPlatformHeaders } from '@monorepo/shared/places';
import Constants from 'expo-constants';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra;

const GOOGLE_PLACES_API_KEY =
  (Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY ||
      extra?.iosGoogleMapsApiKey
    : process.env.EXPO_PUBLIC_ANDROID_GOOGLEMAPS_APIKEY ||
      extra?.androidGoogleMapsApiKey) ?? '';

if (__DEV__) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn(
      '[GooglePlacesProvider] No API key found. Set EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY ' +
        '/ EXPO_PUBLIC_ANDROID_GOOGLEMAPS_APIKEY in your .env, or ensure the keys are ' +
        'set in app.config.js extra.'
    );
  }
}

const GooglePlacesContext = createContext<GooglePlacesClient | null>(null);

type GooglePlacesProviderProps = {
  children: ReactNode;
  platformHeaders?: TPlatformHeaders;
};

export function GooglePlacesProvider({
  children,
  platformHeaders,
}: GooglePlacesProviderProps) {
  const client = useMemo(
    () => new GooglePlacesClient(GOOGLE_PLACES_API_KEY, platformHeaders),
    [platformHeaders]
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

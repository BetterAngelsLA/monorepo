// config.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function loadConfig() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const demoApiUrl = process.env.EXPO_PUBLIC_DEMO_API_URL;

  // Resolve Google Places API key:
  //   1. EXPO_PUBLIC_* env var (inlined by Metro at bundle time)
  //   2. Constants.expoConfig.extra (baked into native binary at build time)
  const extra = Constants.expoConfig?.extra;
  const googlePlacesApiKey =
    (Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY ||
        extra?.iosGoogleMapsApiKey
      : process.env.EXPO_PUBLIC_ANDROID_GOOGLEMAPS_APIKEY ||
        extra?.androidGoogleMapsApiKey) ?? '';

  if (!apiUrl || !demoApiUrl || !googlePlacesApiKey) {
    throw new Error(
      'Missing required config: ' +
        [
          !apiUrl && 'EXPO_PUBLIC_API_URL',
          !demoApiUrl && 'EXPO_PUBLIC_DEMO_API_URL',
          !googlePlacesApiKey && 'Google Places API key',
        ]
          .filter(Boolean)
          .join(', ')
    );
  }

  return { apiUrl, demoApiUrl, googlePlacesApiKey };
}

const { apiUrl, demoApiUrl, googlePlacesApiKey } = loadConfig();

const privacyPolicyUrl = `${apiUrl}/legal/privacy-policy`;
const termsOfServiceUrl = `${apiUrl}/legal/terms-of-service`;

export {
  apiUrl,
  demoApiUrl,
  googlePlacesApiKey,
  privacyPolicyUrl,
  termsOfServiceUrl,
};

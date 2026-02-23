// config.ts
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

/**
 * Read the app config that was embedded in the native binary at EAS build time.
 * In dev client mode, Constants.expoConfig is overridden by the Metro dev server
 * manifest (which re-evaluates app.config.js with local env vars). This function
 * bypasses that and reads the raw native module value instead.
 */
function getEmbeddedExtra(): Record<string, unknown> | undefined {
  const ExponentConstants = requireOptionalNativeModule<{
    manifest?: string | Record<string, unknown>;
  }>('ExponentConstants');
  if (!ExponentConstants?.manifest) return undefined;
  const config =
    typeof ExponentConstants.manifest === 'string'
      ? JSON.parse(ExponentConstants.manifest)
      : ExponentConstants.manifest;
  return config?.extra;
}

function loadConfig() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const demoApiUrl = process.env.EXPO_PUBLIC_DEMO_API_URL;

  // Resolve Google Places API key:
  //   1. EXPO_PUBLIC_* env var (inlined by Metro at bundle time)
  //   2. Constants.expoConfig.extra (dev server manifest)
  //   3. Embedded native binary config (build-time values, bypasses dev server)
  const devExtra = Constants.expoConfig?.extra;
  const embeddedExtra = getEmbeddedExtra();

  const googlePlacesApiKey =
    (Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY ||
        devExtra?.iosGoogleMapsApiKey ||
        embeddedExtra?.iosGoogleMapsApiKey
      : process.env.EXPO_PUBLIC_ANDROID_GOOGLEMAPS_APIKEY ||
        devExtra?.androidGoogleMapsApiKey ||
        embeddedExtra?.androidGoogleMapsApiKey) ?? '';

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

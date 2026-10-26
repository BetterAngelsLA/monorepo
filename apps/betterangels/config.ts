// config.ts
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo';
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

/**
 * Resolve the Google Maps key for the current platform.
 *
 * Resolution order per platform:
 *   1. EXPO_PUBLIC_* env var (inlined by Metro at bundle time)
 *   2. Constants.expoConfig.extra (dev server manifest)
 *   3. Embedded native binary config (build-time values, bypasses dev server)
 *
 * Web has no embedded native config — the browser key is referrer-restricted
 * and is only ever read from the env var or the dev-server manifest.
 */
function resolveGoogleMapsApiKey(
  devExtra: Record<string, unknown> | undefined,
  embeddedExtra: Record<string, unknown> | undefined,
): string {
  if (Platform.OS === 'web') {
    return (
      process.env.EXPO_PUBLIC_WEB_GOOGLEMAPS_JS_APIKEY ||
      (devExtra?.webGoogleMapsApiKey as string | undefined) ||
      ''
    );
  }

  return Platform.OS === 'ios'
    ? ((process.env.EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY ||
        (devExtra?.iosGoogleMapsApiKey as string | undefined) ||
        (embeddedExtra?.iosGoogleMapsApiKey as string | undefined)) ??
        '')
    : ((process.env.EXPO_PUBLIC_ANDROID_GOOGLEMAPS_APIKEY ||
        (devExtra?.androidGoogleMapsApiKey as string | undefined) ||
        (embeddedExtra?.androidGoogleMapsApiKey as string | undefined)) ??
        '');
}

function loadConfig() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const demoApiUrl = process.env.EXPO_PUBLIC_DEMO_API_URL;
  // Optional: a local backend adds a third environment to the switcher, and it
  // is only ever listed when it is configured (`buildApiEnvironments`).
  const localApiUrl = process.env.EXPO_PUBLIC_LOCAL_API_URL;

  const devExtra = Constants.expoConfig?.extra;
  const embeddedExtra = getEmbeddedExtra();

  const googlePlacesApiKey = resolveGoogleMapsApiKey(devExtra, embeddedExtra);

  // A missing Maps key is fatal on native: the build bakes one in, so an empty
  // value means a broken artifact. On web the key arrives as a build-time secret
  // that a deploy environment may not have yet, and this runs at module load
  // (via `app/_layout.tsx`) — throwing there white-screens the *entire* SPA, so
  // it degrades instead: loudly, and only the map/address surfaces lose function.
  const mapsKeyRequired = Platform.OS !== 'web';

  if (!apiUrl || !demoApiUrl || (mapsKeyRequired && !googlePlacesApiKey)) {
    throw new Error(
      'Missing required config: ' +
        [
          !apiUrl && 'EXPO_PUBLIC_API_URL',
          !demoApiUrl && 'EXPO_PUBLIC_DEMO_API_URL',
          // Only where the key is required: on web it is optional (maps
          // degrade), so naming it would send someone hunting for a key when the
          // API URL is what is actually missing.
          mapsKeyRequired && !googlePlacesApiKey && 'Google Places API key',
        ]
          .filter(Boolean)
          .join(', '),
    );
  }

  if (!googlePlacesApiKey) {
    console.error(
      '[config] EXPO_PUBLIC_WEB_GOOGLEMAPS_JS_APIKEY is empty in this build: ' +
        'maps and address search will not work. Set it in the deploy environment.',
    );
  }

  return { apiUrl, demoApiUrl, localApiUrl, googlePlacesApiKey };
}

const { apiUrl, demoApiUrl, localApiUrl, googlePlacesApiKey } = loadConfig();

const privacyPolicyUrl = `${apiUrl}/legal/privacy-policy`;
const termsOfServiceUrl = `${apiUrl}/legal/terms-of-service`;

export {
  apiUrl,
  demoApiUrl,
  localApiUrl,
  googlePlacesApiKey,
  privacyPolicyUrl,
  termsOfServiceUrl,
};

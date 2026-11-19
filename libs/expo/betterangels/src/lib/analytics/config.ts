import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolved from `EXPO_PUBLIC_*` at build time, so a bundle cut without a key
 * cannot enable analytics at runtime.
 *
 * The key is public — it ships in the JS bundle. No host is set here: native
 * talks to US Cloud directly and the web build goes through the first-party
 * proxy, so each client decides that in `client.ts` and `client.web.ts`.
 */
const apiKey = process.env['EXPO_PUBLIC_POSTHOG_API_KEY'] ?? '';

export const analyticsConfig = {
  apiKey,
  enabled: apiKey.length > 0,
  /** Every event carries these, so the app and shelter-web share filters. */
  commonProperties: {
    environment: process.env['EXPO_PUBLIC_APP_ENV'] ?? 'unknown',
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? 'unknown',
  },
};

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * PostHog configuration, resolved from `EXPO_PUBLIC_*` at build time.
 *
 * `EXPO_PUBLIC_` values are inlined per bundle, so a build cut without a key can
 * never enable analytics — the same property the New Relic browser agent relies
 * on. A missing key leaves the app silent rather than sending events to a
 * default project.
 *
 * Key and host are public by design: they ship inside the JS bundle, exactly
 * like the New Relic browser license key.
 */
const apiKey = process.env['EXPO_PUBLIC_POSTHOG_API_KEY'] ?? '';
const host =
  process.env['EXPO_PUBLIC_POSTHOG_HOST'] ?? 'https://us.i.posthog.com';

export const analyticsConfig = {
  apiKey,
  host,
  enabled: apiKey.length > 0,
  /** Every event carries these, so the app and shelter-web share filters. */
  commonProperties: {
    environment: process.env['EXPO_PUBLIC_APP_ENV'] ?? 'unknown',
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? 'unknown',
  },
};
